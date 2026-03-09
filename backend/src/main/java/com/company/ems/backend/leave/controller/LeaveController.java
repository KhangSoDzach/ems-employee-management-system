package com.company.ems.backend.leave.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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
                .body(ApiResponse.success(response));
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
        // TODO: Implement get leaves service
        return ResponseEntity.ok(ApiResponse.success( null));
    }

    /**
     * Get leave request by ID
     * GET /api/v1/leaves/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_VIEW')")
    public ResponseEntity<ApiResponse<String>> getLeaveById(@PathVariable Long id) {
        LeaveResponse response = leaveService.getLeaveById(id);
        // TODO: Implement get leave by id service
        return ResponseEntity.ok(ApiResponse.success(null));
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
        // TODO: Implement leave approval service
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * DELETE /api/v1/leaves/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'LEAVE_CANCEL')")
    public ResponseEntity<ApiResponse<Void>> cancelLeave(@PathVariable Long id) {
        leaveService.cancelLeave(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
