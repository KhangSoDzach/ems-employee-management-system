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
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service responsible for writing and querying authentication audit logs.
 *
 * <p>Key design decisions:
 * <ul>
 *   <li>Logs are written in a SEPARATE transaction ({@code REQUIRES_NEW}) so
 *       a rollback in the calling business transaction never swallows the log.</li>
 *   <li>Log writes are best-effort: any exception is caught and logged at WARN
 *       level so a logging failure never breaks the authentication flow.</li>
 *   <li>No delete / update operations are exposed (AC-05 – append-only).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private static final String ENTITY_TYPE_AUTH = "AUTHENTICATION";

    private final AuditLogRepository auditLogRepository;

    // ─────────────────────────────────────────────────────────────
    // Write operations
    // ─────────────────────────────────────────────────────────────

    /**
     * Records an authentication event.
     *
     * <p>Runs in its own transaction so that a rollback in the caller does not
     * suppress the audit record.  Failures are swallowed (WARN logged) so they
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
    @SuppressWarnings("null")
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

            AuditLog record = AuditLog.builder()
                    .entityType(ENTITY_TYPE_AUTH)
                    .entityId(entityId)
                    .actionType(actionType)
                    .actor(actor != null ? actor : "ANONYMOUS")
                    .identifierAttempted(identifierAttempted)
                    .oldValue(null)
                    .newValue(newValue)
                    .ipAddress(ctx != null ? ctx.getIpAddress() : null)
                    .userAgent(ctx != null ? ctx.getUserAgent() : null)
                    .clientType(ctx != null ? ctx.getClientType() : "WEB")
                    .correlationId(ctx != null ? ctx.getCorrelationId() : null)
                    .build();

            auditLogRepository.save(record);

            log.debug("Audit log written: action={} actor={} identifier={}",
                    actionType, actor, identifierAttempted);

        } catch (Exception ex) {
            // Never let audit logging break the authentication flow
            log.warn("Failed to write audit log [action={}]: {}", actionType, ex.getMessage(), ex);
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
        LocalDateTime to   = filter.getTo() != null
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
        if (loginMethod == null && result == null) return null;
        StringBuilder sb = new StringBuilder("{");
        if (loginMethod != null) sb.append("\"login_method\":\"").append(loginMethod).append("\"");
        if (loginMethod != null && result != null) sb.append(",");
        if (result != null) sb.append("\"result\":\"").append(result).append("\"");
        sb.append("}");
        return sb.toString();
    }
}
