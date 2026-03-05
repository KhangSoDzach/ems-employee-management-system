package com.company.ems.backend.auditlog.controller;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.auditlog.dto.AuditLogFilterRequest;
import com.company.ems.backend.auditlog.dto.AuditLogResponse;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * REST controller exposing read-only Audit Log endpoints.
 * <p>
 * Access control (AC-03): all endpoints require {@code AUDIT_LOG_VIEW} permission.
 * Any user without that permission receives HTTP 403 Forbidden.
 * <p>
 * No write (POST/PUT/DELETE) endpoints are exposed – audit log is append-only.
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Log", description = "Authentication audit log endpoints – Admin only")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * GET /api/v1/audit-logs
     * <p>
     * Returns a paginated, filtered list of audit log records (newest first).
     * All query parameters are optional.
     *
     * @param entityType          filter on entity type (default: AUTHENTICATION)
     * @param actionType          filter on specific action (LOGIN_SUCCESS, etc.)
     * @param actor               partial match on actor (user id)
     * @param identifierAttempted partial match on attempted username/email
     * @param ipAddress           exact IP address filter
     * @param from                start of date-time range (ISO 8601)
     * @param to                  end of date-time range (ISO 8601)
     * @param page                page number (0-based, default 0)
     * @param size                page size (default 20)
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'AUDIT_LOG_VIEW')")
    @Operation(summary = "List audit logs", description = "Returns paginated audit logs. Requires AUDIT_LOG_VIEW permission.")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuthActionType actionType,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String identifierAttempted,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        AuditLogFilterRequest filter = AuditLogFilterRequest.builder()
                .entityType(entityType)
                .actionType(actionType)
                .actor(actor)
                .identifierAttempted(identifierAttempted)
                .ipAddress(ipAddress)
                .from(from)
                .to(to)
                .page(page)
                .size(size)
                .build();

        PageResponse<AuditLogResponse> result = auditLogService.getAuditLogs(filter);

        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", result));
    }

    /**
     * GET /api/v1/audit-logs/{id}
     * <p>
     * Returns a single audit log record by ID (read-only).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'AUDIT_LOG_VIEW')")
    @Operation(summary = "Get audit log by ID", description = "Returns a single audit log record. Requires AUDIT_LOG_VIEW permission.")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getById(@PathVariable Long id) {
        AuditLogResponse response = auditLogService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Audit log detail", response));
    }
}
