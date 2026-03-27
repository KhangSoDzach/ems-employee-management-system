package com.company.ems.backend.attendance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestCreateDto;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.ApprovalActionDto;
import com.company.ems.backend.attendance.service.AttendanceAdjustmentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.rbac.service.DataScopeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/attendance/adjustments")
@RequiredArgsConstructor
@Tag(name = "Attendance Adjustment", description = "Endpoints for manual attendance adjustment workflow")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceAdjustmentController {

    private final AttendanceAdjustmentService adjustmentService;
    private final DataScopeService dataScopeService;

    // --- Employee Endpoints ---

    @PostMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_REQUEST)
    @Operation(summary = "Submit an attendance adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> submitRequest(
            @Valid @RequestBody AdjustmentRequestCreateDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.submitRequest(dto, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã gửi yêu cầu giải trình.", response));
    }

    @PutMapping("/{id}/resubmit")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_REQUEST)
    @Operation(summary = "Resubmit a returned request with updated information")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> resubmitRequest(
            @PathVariable Long id,
            @Valid @RequestBody AdjustmentRequestCreateDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.resubmit(id, dto, principal);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi lại cập nhật yêu cầu giải trình.", response));
    }

    @GetMapping("/my")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_REQUEST)
    @Operation(summary = "Get list of my adjustment requests (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        PageResponse<AdjustmentRequestSummaryResponse> response = adjustmentService.getMyRequests(page, size, principal);
        return ResponseEntity.ok(ApiResponse.success("success", response));
    }

    // --- Approver Endpoints ---

    @GetMapping("/pending")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_APPROVE)
    @Operation(summary = "Get approver inbox with pending items and processed history")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getPendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        PageResponse<AdjustmentRequestSummaryResponse> response = adjustmentService.getPendingForApprover(page, size, principal);
        return ResponseEntity.ok(ApiResponse.success("success", response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_APPROVE)
    @Operation(summary = "Approve an adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.approve(id, dto, principal);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt yêu cầu.", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_APPROVE)
    @Operation(summary = "Reject an adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> rejectRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.reject(id, dto, principal);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu.", response));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_APPROVE)
    @Operation(summary = "Return the request to employee for updates")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> returnRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionDto dto) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.returnToEmployee(id, dto, principal);
        return ResponseEntity.ok(ApiResponse.success("Đã trả lại yêu cầu về nhân viên.", response));
    }

    // --- Common Endpoints ---

    @GetMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_ADJUSTMENT_ANY)
    @Operation(summary = "Get full details of a specific adjustment request")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> getRequestDetail(
            @PathVariable Long id) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AdjustmentRequestResponse response = adjustmentService.getDetail(id, principal);
        return ResponseEntity.ok(ApiResponse.success("success", response));
    }
}
