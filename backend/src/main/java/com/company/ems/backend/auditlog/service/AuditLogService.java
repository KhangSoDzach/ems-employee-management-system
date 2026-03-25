package com.company.ems.backend.auditlog.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auditlog.dto.AuditLogFilterRequest;
import com.company.ems.backend.auditlog.dto.AuditLogResponse;
import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auditlog.entity.AuditLog;
import com.company.ems.backend.auditlog.enums.AuditActionType;
import com.company.ems.backend.auditlog.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;

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

        public record AuditValues(String oldValue, String newValue) {
        }

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
                        AuditActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        String loginMethod,
                        String reason,
                        RequestContext ctx) {

                try {
                        String newValue = buildAuthPayload(loginMethod, reason);
                        writeAuditEvent(ENTITY_TYPE_AUTH, actionType, actor, entityId, identifierAttempted,
                                        new AuditValues(null, newValue), ctx);
                } catch (Exception ex) {
                        log.warn("Failed to write audit log [action={}]: {}", actionType, ex.getMessage());
                }
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logAuthorizationEvent(
                        AuditActionType actionType,
                        String actor,
                        String resource,
                        String reason,
                        String scope,
                        RequestContext ctx) {

                try {
                        String newValue = buildAuthorizationPayload(resource, reason, scope);
                        writeAuditEvent("AUTHORIZATION", actionType, actor, null, null,
                                        new AuditValues(null, newValue), ctx);
                } catch (Exception ex) {
                        log.warn("Failed to write authz log [action={}]: {}", actionType, ex.getMessage());
                }
        }

        /**
         * Generic audit log entry.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logEvent(
                        String entityType,
                        AuditActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        AuditValues values,
                        RequestContext ctx) {

                writeAuditEvent(entityType, actionType, actor, entityId, identifierAttempted, values, ctx);
        }

        private static final java.util.Map<String, Long> rateLimitCache = new java.util.concurrent.ConcurrentHashMap<>();

        private boolean shouldDropLog(AuditActionType actionType, String actor, RequestContext ctx) {
                // 1. ANONYMOUS Rules (FR-LOG-ANTI-SPAM-004)
                if (actor == null || "ANONYMOUS".equalsIgnoreCase(actor) || "anonymous".equals(actor)) {
                        if (actionType != AuditActionType.AUTH_LOGIN_FAILED
                                        && actionType != AuditActionType.AUTH_TOKEN_EXPIRED) {
                                return true; // Drop all other events for anonymous
                        }
                }

                org.springframework.web.context.request.ServletRequestAttributes attrs = (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder
                                .getRequestAttributes();

                if (attrs != null && attrs.getRequest() != null) {
                        jakarta.servlet.http.HttpServletRequest request = attrs.getRequest();

                        // 2. Deduplication per request (FR-LOG-ANTI-SPAM-001)
                        @SuppressWarnings("unchecked")
                        java.util.Set<String> loggedEvents = (java.util.Set<String>) request
                                        .getAttribute("AUDIT_LOGGED_EVENTS");
                        if (loggedEvents == null) {
                                loggedEvents = new java.util.HashSet<>();
                                request.setAttribute("AUDIT_LOGGED_EVENTS", loggedEvents);
                        }
                        if (loggedEvents.contains(actionType.name())) {
                                return true; // Already logged this event type in this request
                        }
                        loggedEvents.add(actionType.name());

                        // 3. Rate Limiting per IP + Action + Endpoint (FR-LOG-ANTI-SPAM-003,
                        // FR-LOG-ANTI-SPAM-005)
                        if (ctx != null && ctx.getIpAddress() != null) {
                                String endpoint = request.getRequestURI();
                                String cacheKey = ctx.getIpAddress() + ":" + actionType.name() + ":" + endpoint;
                                long now = System.currentTimeMillis();
                                Long lastLogged = rateLimitCache.get(cacheKey);
                                if (lastLogged != null && (now - lastLogged) < 5000) {
                                        return true; // Rate limited (within 5 seconds)
                                }
                                rateLimitCache.put(cacheKey, now);
                        }
                }
                return false;
        }

        @SuppressWarnings("null")
        private void writeAuditEvent(
                        String entityType,
                        AuditActionType actionType,
                        String actor,
                        String entityId,
                        String identifierAttempted,
                        AuditValues values,
                        RequestContext ctx) {

                if (shouldDropLog(actionType, actor, ctx)) {
                        return; // dropped by anti-spam policies
                }

                try {
                        AuditLog auditLog = AuditLog.builder()
                                        .entityType(entityType)
                                        .entityId(entityId)
                                        .actionType(actionType)
                                        .actor(actor != null ? actor : "ANONYMOUS")
                                        .identifierAttempted(identifierAttempted)
                                        .oldValue(values != null ? values.oldValue() : null)
                                        .newValue(values != null ? values.newValue() : null)
                                        .ipAddress(ctx != null ? ctx.getIpAddress() : null)
                                        .userAgent(ctx != null ? ctx.getUserAgent() : null)
                                        .clientType(ctx != null ? ctx.getClientType() : "WEB")
                                        .correlationId(ctx != null ? ctx.getCorrelationId() : null)
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

                // Parse dates
                LocalDateTime from = filter.getFrom();
                LocalDateTime to = filter.getTo();

                // AC-07: "From > To" validation
                if (from != null && to != null && from.isAfter(to)) {
                        throw new IllegalArgumentException("Khoảng thời gian không hợp lệ");
                }

                // BR-04: Default filter -> last 24h (performance + security)
                if (from == null && to == null) {
                        from = LocalDateTime.now().minusHours(24);
                        to = LocalDateTime.now();
                } else if (to != null) {
                        // Inclusive boundary logic
                        to = to.withHour(23).withMinute(59).withSecond(59);
                }

                // AC-07: Valid IP Check
                if (filter.getIpAddress() != null && !filter.getIpAddress().isBlank()) {
                        String ip = filter.getIpAddress();
                        boolean isIpv4 = ip.matches(
                                        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
                        boolean isIpv6 = ip.contains(":");
                        if (!isIpv4 && !isIpv6) {
                                throw new IllegalArgumentException("Định dạng IP không hợp lệ");
                        }
                }

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

        private String buildAuthPayload(String loginMethod, String reason) {
                if (loginMethod == null && reason == null) {
                        return "{}";
                }
                StringBuilder sb = new StringBuilder("{");
                boolean first = true;
                if (loginMethod != null) {
                        sb.append("\"login_method\":\"").append(loginMethod).append("\"");
                        first = false;
                }
                if (reason != null) {
                        if (!first)
                                sb.append(",");
                        sb.append("\"reason\":\"").append(reason).append("\"");
                }
                sb.append("}");
                return sb.toString();
        }

        private String buildAuthorizationPayload(String resource, String reason, String scope) {
                if (resource == null && reason == null && scope == null) {
                        return "{}";
                }
                StringBuilder sb = new StringBuilder("{");
                boolean first = true;
                if (reason != null) {
                        sb.append("\"reason\":\"").append(reason).append("\"");
                        first = false;
                }
                if (resource != null) {
                        if (!first)
                                sb.append(",");
                        sb.append("\"resource\":\"").append(resource).append("\"");
                        first = false;
                }
                if (scope != null) {
                        if (!first)
                                sb.append(",");
                        sb.append("\"scope\":\"").append(scope).append("\"");
                }
                sb.append("}");
                return sb.toString();
        }
}
