package com.company.ems.backend.auditlog.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

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
import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.enums.ResourceType;
import com.company.ems.backend.auditlog.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Production-ready Audit Log service.
 * Standardized for compliance, security-first, and non-intrusive.
 * Uses Enums for all logic to prevent hardcoded string typos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

        private static final int ANTI_SPAM_SECONDS = 5;

        public record AuditValues(String oldValue, String newValue) {
        }

        private final AuditLogRepository auditLogRepository;
        private final com.company.ems.backend.employee.repository.EmployeeRepository employeeRepository;

        // ─────────────────────────────────────────────────────────────
        // Write operations (Non-intrusive)
        // ─────────────────────────────────────────────────────────────

        /**
         * Records an authentication event (legacy compatibility wrapper).
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logAuthEvent(
                        AuthActionType legacyAction,
                        String actor,
                        String targetId,
                        String identifier,
                        String loginMethod,
                        String result,
                        RequestContext ctx) {

                AuditAction action = mapLegacyAction(legacyAction);
                if (action == null)
                        return;

                // Requirement: DO NOT log noise or specific anonymous logs if necessary
                if (action == AuditAction.TOKEN_REFRESH && "ANONYMOUS".equals(actor)) {
                        return;
                }

                logEvent(ResourceType.AUTH, action, actor, targetId, identifier,
                                new AuditValues(null, buildNewValueJSON(loginMethod, result)), ctx);
        }

        /**
         * Standardized logging entry point.
         * Uses Enums (ResourceType, AuditAction) to ensure type safety.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void logEvent(
                        ResourceType resource,
                        AuditAction action,
                        String actor,
                        String targetId,
                        String identifier,
                        AuditValues values,
                        RequestContext ctx) {

                try {
                        RequestContext effectiveCtx = resolveRequestContext(ctx);
                        String actorUsername = (actor == null || actor.isBlank()) ? "ANONYMOUS" : actor;
                        String clientIp = effectiveCtx.getIpAddress();

                        // 1. Anti-Spam Check: within 5 seconds same actor + IP + action
                        if (isSpam(actorUsername, clientIp, action)) {
                                log.trace("Suppressed spam audit log: {} from {}/{}", action, actorUsername, clientIp);
                                return;
                        }

                        // 2. Build and Save
                        AuditLog auditLog = AuditLog.builder()
                                        .resource(resource != null ? resource : ResourceType.AUTH)
                                        .eventType(action.getType()) // Maps to Category internally
                                        .action(action)
                                        .actor(actorUsername)
                                        .targetId(targetId)
                                        .identifier(identifier)
                                        .oldValue(values != null ? values.oldValue() : null)
                                        .newValue(values != null ? values.newValue() : null)
                                        .ipAddress(clientIp)
                                        .userAgent(effectiveCtx.getUserAgent())
                                        .clientType(effectiveCtx.getClientType())
                                        .correlationId(effectiveCtx.getCorrelationId())
                                        .build();

                        auditLogRepository.save(auditLog);
                        log.debug("[AUDIT] Registered: {} -> {} -> {}", actorUsername, action, resource);

                } catch (Exception ex) {
                        // Non-intrusive: never break business logic
                        log.warn("Non-intrusive audit log failure: {}", ex.getMessage());
                }
        }

        private boolean isSpam(String actor, String ip, AuditAction action) {
                if (ip == null)
                        return false;
                LocalDateTime since = LocalDateTime.now().minusSeconds(ANTI_SPAM_SECONDS);
                return auditLogRepository.findLastSameEvent(actor, ip, action, since).isPresent();
        }

        // ─────────────────────────────────────────────────────────────
        // Read operations (Admin only)
        // ─────────────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public PageResponse<AuditLogResponse> getAuditLogs(AuditLogFilterRequest filter) {
                LocalDateTime to = filter.getTo() != null
                                ? filter.getTo().withHour(23).withMinute(59).withSecond(59)
                                : null;

                PageRequest pageable = PageRequest.of(filter.getPage(), filter.getSize());

                Page<AuditLog> page = auditLogRepository.findByFilters(
                                filter.getResource(),
                                filter.getAction(),
                                filter.getActor(),
                                filter.getIdentifier(),
                                filter.getIpAddress(),
                                filter.getFrom(),
                                to,
                                filter.isShowAnonymous(),
                                pageable);

                Set<String> usernames = page.getContent().stream()
                                .map(AuditLog::getIdentifier)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());

                Map<String, String> nameCache = new HashMap<>();
                if (!usernames.isEmpty()) {
                        employeeRepository.findAllByUserUsernameIn(usernames).forEach(e -> {
                                if (e.getUser() != null) {
                                        nameCache.put(e.getUser().getUsername(), e.getFullName());
                                }
                        });
                }

                List<AuditLogResponse> content = page.getContent().stream()
                                .map(a -> {
                                        AuditLogResponse resp = toResponse(a);
                                        if (a.getIdentifier() != null && nameCache.containsKey(a.getIdentifier())) {
                                                String fullName = nameCache.get(a.getIdentifier());
                                                resp.setIdentifier(fullName);
                                                if (resp.getTarget() != null) {
                                                        resp.getTarget().setName(fullName);
                                                }
                                        }
                                        return resp;
                                }).toList();

                return PageResponse.<AuditLogResponse>builder()
                                .content(content)
                                .page(page.getNumber())
                                .size(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .build();
        }

        @Transactional(readOnly = true)
        public AuditLogResponse getById(Long id) {
                AuditLog entry = auditLogRepository.findById(id)
                                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Log not found"));
                return toResponse(entry);
        }

        // ─────────────────────────────────────────────────────────────
        // Mapping & Helpers
        // ─────────────────────────────────────────────────────────────

        private AuditAction mapLegacyAction(AuthActionType legacy) {
                if (legacy == null)
                        return null;
                return switch (legacy) {
                        case LOGIN_SUCCESS -> AuditAction.LOGIN_SUCCESS;
                        case LOGIN_FAILED -> AuditAction.LOGIN_FAILED;
                        case LOGOUT -> AuditAction.LOGOUT;
                        case TOKEN_REFRESH_SUCCESS -> AuditAction.TOKEN_REFRESH;
                        case TOKEN_REFRESH_FAILED -> AuditAction.TOKEN_REFRESH_FAILED;
                        case PASSWORD_CHANGED -> AuditAction.PASSWORD_CHANGE;
                        case ACCESS_DENIED -> AuditAction.ACCESS_DENIED;
                        case TOKEN_REVOKED -> AuditAction.LOGOUT;
                        case TOKEN_EXPIRED -> AuditAction.TOKEN_EXPIRED;
                        default -> null;
                };
        }

        private AuditLogResponse toResponse(AuditLog a) {
                return AuditLogResponse.builder()
                                .id(a.getId())
                                .resource(a.getResource())
                                .eventType(a.getEventType())
                                .action(a.getAction())
                                .targetId(a.getTargetId())
                                .identifier(a.getIdentifier())
                                .actor(a.getActor())
                                .oldValue(a.getOldValue())
                                .newValue(a.getNewValue())
                                .ipAddress(a.getIpAddress())
                                .userAgent(a.getUserAgent())
                                .clientType(a.getClientType())
                                .correlationId(a.getCorrelationId())
                                .createdAt(a.getCreatedAt())
                                .target(AuditLogResponse.TargetDetail.builder()
                                                .id(a.getTargetId())
                                                .name(a.getIdentifier())
                                                .type(a.getResource() != null ? a.getResource().name() : null)
                                                .build())
                                .build();
        }

        private String buildNewValueJSON(String method, String result) {
                if (method == null && result == null)
                        return null;
                return String.format("{\"method\":\"%s\",\"result\":\"%s\"}", method, result);
        }

        private RequestContext resolveRequestContext(RequestContext providedCtx) {
                String ip = providedCtx != null ? providedCtx.getIpAddress() : null;
                String userAgent = providedCtx != null ? providedCtx.getUserAgent() : null;
                String clientType = providedCtx != null ? providedCtx.getClientType() : null;
                String correlationId = providedCtx != null ? providedCtx.getCorrelationId() : null;

                HttpServletRequest req = currentHttpRequest();
                if (req != null) {
                        if (ip == null)
                                ip = com.company.ems.backend.common.utils.IpUtils.getClientIpAddress(req);
                        if (userAgent == null)
                                userAgent = req.getHeader("User-Agent");
                        if (correlationId == null)
                                correlationId = req.getHeader("X-Correlation-ID");
                }

                if (clientType == null)
                        clientType = inferClientType(userAgent);

                return RequestContext.builder()
                                .ipAddress(ip).userAgent(userAgent).clientType(clientType).correlationId(correlationId)
                                .build();
        }

        private HttpServletRequest currentHttpRequest() {
                RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
                return (attrs instanceof ServletRequestAttributes sAttrs) ? sAttrs.getRequest() : null;
        }

        private String inferClientType(String ua) {
                if (ua == null)
                        return "WEB";
                String lower = ua.toLowerCase();
                if (lower.contains("android") || lower.contains("ios") || lower.contains("flutter"))
                        return "MOBILE";
                if (lower.contains("curl") || lower.contains("postman"))
                        return "API";
                return "WEB";
        }
}
