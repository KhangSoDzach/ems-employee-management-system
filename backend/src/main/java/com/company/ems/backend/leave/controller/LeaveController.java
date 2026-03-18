package com.company.ems.backend.leave.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveActionRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.service.LeaveService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {
    private final LeaveService leaveService;

    private static final String MESSAGE_SUCCESS = "success";
    private static final String MESSAGE_LEAVE_SUBMITTED = "Leave request submitted successfully";
    private static final String MESSAGE_LEAVE_PROCESSED = "Leave request processed successfully";
    private static final String MESSAGE_LEAVE_CANCELLED = "Hủy yêu cầu nghỉ phép thành công";

    private static final String ACTION_APPROVE = "APPROVE";
    private static final String ACTION_REJECT = "REJECT";
    private static final String ACTION_SEND_BACK = "SEND_BACK";
    /**
     * Submit a leave request
     * POST /api/v1/leaves
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_CREATE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> createLeaveRequest(
            @Valid @RequestBody LeaveRequest request) {
        LeaveResponse response = leaveService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(MESSAGE_LEAVE_SUBMITTED, response));
    }

    /**
     * Get all leave requests with filtering and pagination
     * GET /api/v1/leaves
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getAllLeaves(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PageResponse<LeaveResponse> response =
            leaveService.getAllLeaves(page, size, employeeId, status, leaveType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_SUCCESS, response));
    }

    /**
     * Get current user's own leave requests (always self-scoped)
     * GET /api/v1/leaves/me
     */
    @GetMapping("/me")
    @PreAuthorize("hasPermission(null, 'LEAVE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getMyLeaves(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<LeaveResponse> response = leaveService.getMyLeaves(page, size);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_SUCCESS, response));
    }

    /**
     * Get leave request by ID
     * GET /api/v1/leaves/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_VIEW')")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        LeaveResponse response = leaveService.getLeaveById(id);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_SUCCESS, response));
    }

    /**
     * Approve or reject leave request
     * PUT /api/v1/leaves/{id}/approve
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasPermission(null, 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> approveLeave(
            @PathVariable Long id,
            @Valid @RequestBody ApproveLeaveRequest request) {
        LeaveResponse response = leaveService.approveLeave(id, request);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_LEAVE_PROCESSED, response));
    }

    /**
     * New adapter endpoint for frontend action payloads.
     * PUT /api/v1/leaves/{id}/action – maps frontend `action` -> service status
     */
    @PutMapping("/{id}/action")
    @PreAuthorize("hasPermission(null, 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> processAction(
            @PathVariable Long id,
            @Valid @RequestBody LeaveActionRequest actionRequest) {
        String action = actionRequest.getAction() != null ? actionRequest.getAction().trim().toUpperCase() : null;
        if (action == null) {
            throw new IllegalArgumentException("Unsupported action: null");
        }
        String status = switch (action) {
            case ACTION_APPROVE -> "APPROVED";
            case ACTION_REJECT -> "REJECTED";
            case ACTION_SEND_BACK -> "RETURNED_TO_EMPLOYEE";
            default -> throw new IllegalArgumentException("Unsupported action: " + action);
        };

        ApproveLeaveRequest req = ApproveLeaveRequest.builder()
                .status(status)
                .notes(actionRequest.getComments())
                .build();

        LeaveResponse response = leaveService.approveLeave(id, req);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_LEAVE_PROCESSED, response));
    }

    /**
     * DELETE /api/v1/leaves/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_CANCEL')")
    public ResponseEntity<ApiResponse<Void>> cancelLeave(@PathVariable Long id) {
        leaveService.cancelLeave(id);
        return ResponseEntity.ok(ApiResponse.success(MESSAGE_LEAVE_CANCELLED, null));
    }
}
