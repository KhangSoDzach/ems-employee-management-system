package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestCreateDto;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.ApprovalActionDto;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.attendance.service.AttendanceAdjustmentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.rbac.service.DataScopeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/attendance/adjustments")
@RequiredArgsConstructor
@Tag(name = "Attendance Adjustments", description = "Manual attendance correction request workflow")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceAdjustmentController {

    private final AttendanceAdjustmentService adjustmentService;
    private final MessageService messages;
    private final DataScopeService            dataScopeService;

    @PostMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
    @Operation(summary = "Submit a new attendance adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> submitRequest(
            @Valid @RequestBody AdjustmentRequestCreateDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.submitRequest(dto, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.ADJUSTMENT_SUBMITTED), response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
    @Operation(summary = "Get my attendance adjustment requests (employee view)")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getMyRequests(page, size, principal)));
    }

    @PutMapping("/{id}/resubmit")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
    @Operation(summary = "Resubmit a returned adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> resubmit(
            @PathVariable Long id,
            @Valid @RequestBody AdjustmentRequestCreateDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.ADJUSTMENT_RESUBMITTED),
                adjustmentService.resubmit(id, dto, principal)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Get pending requests awaiting the current approver's action")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getPendingForApprover(page, size, principal)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST') or hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Get full detail of an adjustment request (including audit timeline)")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> getDetail(
            @PathVariable Long id) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getDetail(id, principal)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Approve an adjustment request at the current level")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> approve(
            @PathVariable Long id,
            @RequestBody ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                adjustmentService.approve(id, dto, principal)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Reject an adjustment request (reason required)")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                adjustmentService.reject(id, dto, principal)));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Return an adjustment request to the employee (reason required)")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> returnToEmployee(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                adjustmentService.returnToEmployee(id, dto, principal)));
    }
}