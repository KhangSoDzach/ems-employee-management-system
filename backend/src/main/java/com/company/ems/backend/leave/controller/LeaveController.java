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
    /**
     * Submit a leave request
     * POST /api/v1/leaves
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_CREATE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> createLeaveRequest(
            @Valid @RequestBody LeaveRequest request) {
        // TODO: Implement leave request service
        LeaveResponse response = leaveService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted successfully",response));
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
        return ResponseEntity.ok(ApiResponse.success("success", response));
    }

    /**
     * Get leave request by ID
     * GET /api/v1/leaves/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_VIEW')")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        LeaveResponse response = leaveService.getLeaveById(id);
        return ResponseEntity.ok(ApiResponse.success("success", response));
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
        return ResponseEntity.ok(ApiResponse.success("Leave request processed successfully",response));
    }

    /**
     * New adapter endpoint for frontend action payloads.
     * PUT /api/v1/leaves/{id}/action – maps frontend `action` -> service status
     */
    @PutMapping("/{id}/action")
    @PreAuthorize("hasPermission(null, 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> processAction(
            @PathVariable Long id,
            @Valid @RequestBody com.company.ems.backend.leave.dto.LeaveActionRequest actionRequest) {
        String action = actionRequest.getAction() != null ? actionRequest.getAction().trim().toUpperCase() : null;
        String status;
        if ("APPROVE".equals(action)) {
            status = "APPROVED";
        } else if ("REJECT".equals(action)) {
            status = "REJECTED";
        } else if ("SEND_BACK".equals(action)) {
            status = "RETURNED_TO_EMPLOYEE";
        } else {
            throw new IllegalArgumentException("Unsupported action: " + action);
        }

        ApproveLeaveRequest req = ApproveLeaveRequest.builder()
                .status(status)
                .notes(actionRequest.getComments())
                .build();

        LeaveResponse response = leaveService.approveLeave(id, req);
        return ResponseEntity.ok(ApiResponse.success("Leave request processed successfully", response));
    }

    /**
     * DELETE /api/v1/leaves/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_CANCEL')")
    public ResponseEntity<ApiResponse<Void>> cancelLeave(@PathVariable Long id) {
        leaveService.cancelLeave(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy yêu cầu nghỉ phép thành công", null));
    }
}
