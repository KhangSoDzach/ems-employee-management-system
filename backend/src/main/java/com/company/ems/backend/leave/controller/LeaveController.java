package com.company.ems.backend.leave.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "Leave Management", description = "APIs for managing employee leave requests")
@RestController
@RequestMapping("/api/v1/leaves")
public class LeaveController {

    @Operation(summary = "Submit leave request", description = "Submit a new leave request")
    @PostMapping
    public ResponseEntity<ApiResponse<LeaveResponse>> createLeaveRequest(
            @Valid @RequestBody LeaveRequest request) {
        // TODO: Implement leave request service
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted successfully", null));
    }

    @Operation(summary = "Get all leave requests", description = "Retrieve all leave requests with filtering and pagination")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getAllLeaves(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String leaveType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        // TODO: Implement get leaves service
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "Get leave by ID", description = "Retrieve a specific leave request by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        // TODO: Implement get leave by id service
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "Approve/Reject leave", description = "Approve or reject a leave request")
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<LeaveResponse>> approveLeave(
            @PathVariable Long id,
            @Valid @RequestBody ApproveLeaveRequest request) {
        // TODO: Implement leave approval service
        return ResponseEntity.ok(ApiResponse.success("Leave request processed successfully", null));
    }
}
