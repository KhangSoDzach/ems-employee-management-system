package com.company.ems.backend.audit.controller;

import com.company.ems.backend.audit.dto.AuditLogDetailResponse;
import com.company.ems.backend.audit.dto.AuditLogFilterRequest;
import com.company.ems.backend.audit.dto.AuditLogSummaryResponse;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.service.AuditLogService;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@Validated
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Admin - Audit Logs", description = "Audit log management (Admin only)")
public class AuditLogController {

    private final AuditLogService auditLogService;
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_AUDIT_VIEW')")
    @Operation(summary = "List audit logs with filters (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogSummaryResponse>>> listLogs(
            @RequestParam(required = false) Long             userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) AuditResult     result,
            @RequestParam(required = false) AuditActionType actionType,
            @RequestParam(defaultValue = "0")  @Min(0)        int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

        AuditLogFilterRequest filter = AuditLogFilterRequest.builder()
                .userId(userId)
                .fromDate(fromDate)
                .toDate(toDate)
                .result(result)
                .actionType(actionType)
                .page(page)
                .size(size)
                .build();

        return ResponseEntity.ok(ApiResponse.success(auditLogService.queryLogs(filter)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR_ADMIN')")
    @Operation(summary = "Get audit log detail by ID (Admin only)")
    public ResponseEntity<ApiResponse<AuditLogDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogById(id)));
    }
}