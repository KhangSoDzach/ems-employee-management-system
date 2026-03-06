package com.company.ems.backend.leave.controller;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveApprovalHistoryResponse;
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.service.LeaveApprovalService;
import com.company.ems.backend.leave.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for leave request management.
 *
 * <p>
 * Approval actions now use the new {@link LeaveApprovalRequest} DTO
 * supporting APPROVE / REJECT / SEND_BACK.
 * The legacy {@code PUT /{id}/approve} endpoint is retained for backward
 * compatibility and maps to the same service logic.
 */
@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveApprovalService leaveApprovalService;

    // ─── Employee endpoints ───────────────────────────────────────────────────

    /**
     * Submit a leave request.
     * POST /api/v1/leaves
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_WRITE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> createLeaveRequest(
            @Valid @RequestBody LeaveRequest request) {
        LeaveResponse response = leaveService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted successfully", response));
    }

    /**
     * List leave requests (scope based on caller's role / data-scope).
     * GET /api/v1/leaves
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_READ')")
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getAllLeaves(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PageResponse<LeaveResponse> response = leaveService.getAllLeaves(page, size, employeeId, status, leaveType,
                startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Get leave request by ID.
     * GET /api/v1/leaves/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_READ')")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        LeaveResponse response = leaveService.getLeaveById(id);
        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Get full approval history for a leave request (FR-WORKFLOW-007).
     * GET /api/v1/leaves/{id}/history
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasPermission(null, 'LEAVE_READ')")
    public ResponseEntity<ApiResponse<List<LeaveApprovalHistoryResponse>>> getLeaveHistory(
            @PathVariable Long id) {
        List<LeaveApprovalHistoryResponse> history = leaveApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("OK", history));
    }

    // ─── Approver endpoints ───────────────────────────────────────────────────

    /**
     * Multi-level approval action: APPROVE / REJECT / SEND_BACK.
     * PUT /api/v1/leaves/{id}/action
     */
    @PutMapping("/{id}/action")
    @PreAuthorize("hasPermission(null, 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> processApproval(
            @PathVariable Long id,
            @Valid @RequestBody LeaveApprovalRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        LeaveResponse response = leaveApprovalService.processApproval(id, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Leave request processed successfully", response));
    }

    /**
     * Legacy approval endpoint — maps to the new service (supports APPROVED /
     * REJECTED only).
     * PUT /api/v1/leaves/{id}/approve
     *
     * @deprecated Use {@code PUT /api/v1/leaves/{id}/action} with
     *             {@link LeaveApprovalRequest} instead.
     */
    @Deprecated
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasPermission(null, 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> approveLeave(
            @PathVariable Long id,
            @Valid @RequestBody ApproveLeaveRequest request) {
        LeaveResponse response = leaveService.approveLeave(id, request);
        return ResponseEntity.ok(ApiResponse.success("Leave request processed successfully", response));
    }

    // ─── Employee cancel ──────────────────────────────────────────────────────

    /**
     * Cancel own leave request (PENDING state only).
     * DELETE /api/v1/leaves/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_CANCEL')")
    public ResponseEntity<ApiResponse<Void>> cancelLeave(@PathVariable Long id) {
        leaveService.cancelLeave(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy yêu cầu nghỉ phép thành công", null));
    }
}
