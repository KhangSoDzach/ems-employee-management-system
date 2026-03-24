package com.company.ems.backend.auditlog.service;

import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.company.ems.backend.auditlog.dto.AuditLogFilterRequest;
import com.company.ems.backend.auditlog.dto.AuditLogResponse;
import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auditlog.entity.AuditLog;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service responsible for writing and querying authentication audit logs.
 *
 * <p>
 * Key design decisions:
 * <ul>
 * <li>Logs are written in a SEPARATE transaction ({@code REQUIRES_NEW}) so
 * a rollback in the calling business transaction never swallows the log.</li>
 * <li>Log writes are best-effort: any exception is caught and logged at WARN
 * level so a logging failure never breaks the authentication flow.</li>
 * <li>No delete / update operations are exposed (AC-05 – append-only).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

        private static final String ENTITY_TYPE_AUTH = "AUTHENTICATION";
        private static final Pattern FORWARDED_FOR_PATTERN = Pattern.compile("(?i)(?:^|;)\\s*for=\\\"?([^;\\\",]+)");

        public record AuditValues(String oldValue, String newValue) {}

        private final AuditLogRepository auditLogRepository;

        // ─────────────────────────────────────────────────────────────
        // Write operations
        // ─────────────────────────────────────────────────────────────

        /**
         * Records an authentication event.
         *
         * <p>
         * Runs in its own transaction so that a rollback in the caller does not
         * suppress the audit record. Failures are swallowed (WARN logged) so they
         * never interrupt the auth flow.
         *
         * @param actionType          the action that occurred
         * @param actor               resolved user ID string, or {@code "ANONYMOUS"}
         * @param entityId            same as actor for auth events (user_id / subject)
         * @param identifierAttempted the username / email that was submitted
         * @param loginMethod         e.g. {@code "JWT"} or {@code "SSO"}
         * @param result              {@code "SUCCESS"} or {@code "FAILED"}
         * @param ctx                 per-request network context (ip, ua, …)
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logAuthEvent(
                        AuthActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        String loginMethod,
                        String result,
                        RequestContext ctx) {

                try {
                        String newValue = buildNewValue(loginMethod, result);
                        writeAuditEvent(ENTITY_TYPE_AUTH, actionType, actor, entityId, identifierAttempted,
                                        new AuditValues(null, newValue), ctx);
                } catch (Exception ex) {
                        log.warn("Failed to write audit log [action={}]: {}", actionType, ex.getMessage());
                }
        }

        /**
         * Generic audit log entry.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logEvent(
                        String entityType,
                        AuthActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        AuditValues values,
                        RequestContext ctx) {

                writeAuditEvent(entityType, actionType, actor, entityId, identifierAttempted, values, ctx);
        }

        @SuppressWarnings("null")
        private void writeAuditEvent(
                        String entityType,
                        AuthActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        AuditValues values,
                        RequestContext ctx) {

                try {
                        RequestContext effectiveCtx = resolveRequestContext(ctx);

                        AuditLog auditLog = AuditLog.builder()
                                        .entityType(entityType)
                                        .entityId(entityId)
                                        .actionType(actionType)
                                        .actor(actor != null ? actor : "ANONYMOUS")
                                        .identifierAttempted(identifierAttempted)
                                        .oldValue(values != null ? values.oldValue() : null)
                                        .newValue(values != null ? values.newValue() : null)
                                        .ipAddress(effectiveCtx.getIpAddress())
                                        .userAgent(effectiveCtx.getUserAgent())
                                        .clientType(effectiveCtx.getClientType())
                                        .correlationId(effectiveCtx.getCorrelationId())
                                        .build();

                        auditLogRepository.save(auditLog);
                        log.debug("Audit record saved: type={} action={} actor={}", entityType, actionType, actor);
                } catch (Exception ex) {
                        log.warn("Failed to save audit record: {}", ex.getMessage());
                }
        }

        // ─────────────────────────────────────────────────────────────
        // Read operations (Admin only)
        // ─────────────────────────────────────────────────────────────

        /**
         * Returns a paginated, filtered list of audit log entries.
         * Access control is enforced at the controller layer.
         *
         * @param filter filter criteria (all fields optional)
         * @return page of {@link AuditLogResponse}
         */
        @Transactional(readOnly = true)
        public PageResponse<AuditLogResponse> getAuditLogs(AuditLogFilterRequest filter) {

                // Default entity type to AUTHENTICATION when not specified
                String entityType = filter.getEntityType() != null
                                ? filter.getEntityType()
                                : ENTITY_TYPE_AUTH;

                // Parse dates – expand "to" to end-of-day if only a date (no time) was provided
                LocalDateTime from = filter.getFrom();
                LocalDateTime to = filter.getTo() != null
                                ? filter.getTo().withHour(23).withMinute(59).withSecond(59)
                                : null;

                PageRequest pageable = PageRequest.of(filter.getPage(), filter.getSize());

                Page<AuditLog> page = auditLogRepository.findByFilters(
                                entityType,
                                filter.getActionType(),
                                filter.getActor(),
                                filter.getIdentifierAttempted(),
                                filter.getIpAddress(),
                                from,
                                to,
                                pageable);

                return PageResponse.<AuditLogResponse>builder()
                                .content(page.getContent().stream().map(this::toResponse).toList())
                                .page(page.getNumber())
                                .size(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .build();
        }

        /**
         * Retrieves a single audit log record by ID (read-only detail view).
         */
        @Transactional(readOnly = true)
        @SuppressWarnings("null")
        public AuditLogResponse getById(Long id) {
                AuditLog entry = auditLogRepository.findById(id)
                                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                                                "Audit log not found: " + id));
                return toResponse(entry);
        }

        // ─────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────

        private AuditLogResponse toResponse(AuditLog a) {
                return AuditLogResponse.builder()
                                .id(a.getId())
                                .entityType(a.getEntityType())
                                .entityId(a.getEntityId())
                                .actionType(a.getActionType())
                                .actor(a.getActor())
                                .identifierAttempted(a.getIdentifierAttempted())
                                .oldValue(a.getOldValue())
                                .newValue(a.getNewValue())
                                .ipAddress(a.getIpAddress())
                                .userAgent(a.getUserAgent())
                                .clientType(a.getClientType())
                                .correlationId(a.getCorrelationId())
                                .createdAt(a.getCreatedAt())
                                .build();
        }

        private String buildNewValue(String loginMethod, String result) {
                if (loginMethod == null && result == null)
                        return null;
                StringBuilder sb = new StringBuilder("{");
                if (loginMethod != null)
                        sb.append("\"login_method\":\"").append(loginMethod).append("\"");
                if (loginMethod != null && result != null)
                        sb.append(",");
                if (result != null)
                        sb.append("\"result\":\"").append(result).append("\"");
                sb.append("}");
                return sb.toString();
        }

        private RequestContext resolveRequestContext(RequestContext providedCtx) {
                String ip = nullIfBlank(providedCtx != null ? providedCtx.getIpAddress() : null);
                String userAgent = nullIfBlank(providedCtx != null ? providedCtx.getUserAgent() : null);
                String clientType = nullIfBlank(providedCtx != null ? providedCtx.getClientType() : null);
                String correlationId = nullIfBlank(providedCtx != null ? providedCtx.getCorrelationId() : null);

                HttpServletRequest currentRequest = currentHttpRequest();
                if (currentRequest != null) {
                        if (ip == null) {
                                ip = extractClientIp(currentRequest);
                        }
                        if (userAgent == null) {
                                userAgent = nullIfBlank(currentRequest.getHeader("User-Agent"));
                        }
                        if (correlationId == null) {
                                correlationId = firstNonBlank(
                                                currentRequest.getHeader("X-Correlation-ID"),
                                                currentRequest.getHeader("X-Correlation-Id"),
                                                currentRequest.getHeader("X-Request-ID"),
                                                currentRequest.getHeader("X-Request-Id"));
                        }
                }

                if (clientType == null) {
                        clientType = inferClientType(userAgent);
                }

                return RequestContext.builder()
                                .ipAddress(ip)
                                .userAgent(userAgent)
                                .clientType(clientType)
                                .correlationId(correlationId)
                                .build();
        }

        private HttpServletRequest currentHttpRequest() {
                RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
                if (attributes instanceof ServletRequestAttributes servletAttrs) {
                        return servletAttrs.getRequest();
                }
                return null;
        }

        private String extractClientIp(HttpServletRequest request) {
                String ip = firstNonBlank(
                                firstIpFromHeader(request.getHeader("X-Forwarded-For")),
                                firstIpFromForwardedHeader(request.getHeader("Forwarded")),
                                request.getHeader("X-Real-IP"),
                                request.getHeader("CF-Connecting-IP"),
                                request.getHeader("True-Client-IP"),
                                request.getRemoteAddr());
                return normalizeIp(ip);
        }

        private String firstIpFromHeader(String value) {
                String nonBlank = nullIfBlank(value);
                if (nonBlank == null) {
                        return null;
                }
                int commaIdx = nonBlank.indexOf(',');
                String candidate = commaIdx >= 0 ? nonBlank.substring(0, commaIdx) : nonBlank;
                return normalizeIp(candidate);
        }

        private String firstIpFromForwardedHeader(String forwarded) {
                String nonBlank = nullIfBlank(forwarded);
                if (nonBlank == null) {
                        return null;
                }
                Matcher matcher = FORWARDED_FOR_PATTERN.matcher(nonBlank);
                if (!matcher.find()) {
                        return null;
                }
                return normalizeIp(matcher.group(1));
        }

        private String normalizeIp(String value) {
                String candidate = nullIfBlank(value);
                if (candidate == null) {
                        return null;
                }
                if ("unknown".equalsIgnoreCase(candidate)) {
                        return null;
                }
                if (candidate.startsWith("[") && candidate.endsWith("]") && candidate.length() > 2) {
                        candidate = candidate.substring(1, candidate.length() - 1);
                }
                return candidate;
        }

        private String inferClientType(String userAgent) {
                String ua = nullIfBlank(userAgent);
                if (ua == null) {
                        return "WEB";
                }
                String lower = ua.toLowerCase();
                if (lower.contains("okhttp") || lower.contains("android") || lower.contains("ios")
                                || lower.contains("dart") || lower.contains("flutter")) {
                        return "MOBILE";
                }
                if (lower.contains("python") || lower.contains("java/") || lower.contains("go-http")
                                || lower.contains("curl") || lower.contains("postman") || lower.contains("axios")) {
                        return "API";
                }
                return "WEB";
        }

        private String firstNonBlank(String... values) {
                if (values == null) {
                        return null;
                }
                for (String value : values) {
                        String nonBlank = nullIfBlank(value);
                        if (nonBlank != null) {
                                return nonBlank;
                        }
                }
                return null;
        }

        private String nullIfBlank(String value) {
                if (value == null) {
                        return null;
                }
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }
}
