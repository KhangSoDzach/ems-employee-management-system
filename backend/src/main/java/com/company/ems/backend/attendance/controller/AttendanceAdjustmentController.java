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
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.rbac.service.DataScopeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for manual attendance adjustment requests.
 *
 * <p>
 * Endpoints are prefixed with {@code /api/v1/attendance/adjustments}.
 *
 * <h3>Access control:</h3>
 * <ul>
 * <li>Employees: submit, resubmit, view their own requests.
 * <li>Managers/HR: view pending requests, approve/reject/return.
 * <li>Admins: all of the above.
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/attendance/adjustments")
@RequiredArgsConstructor
@Tag(name = "Attendance Adjustments", description = "Manual attendance correction request workflow")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceAdjustmentController {

        private final AttendanceAdjustmentService adjustmentService;
        private final DataScopeService dataScopeService;

        // ─── Employee endpoints ───────────────────────────────────────────────────

        /**
         * POST /api/v1/attendance/adjustments
         * Submit a new manual adjustment request.
         */
        @PostMapping
        @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
        @Operation(summary = "Submit a new attendance adjustment request")
        public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> submitRequest(
                        @Valid @RequestBody AdjustmentRequestCreateDto dto) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                AdjustmentRequestResponse response = adjustmentService.submitRequest(dto, principal);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Yêu cầu điều chỉnh chấm công đã được gửi.", response));
        }

    /**
     * GET /api/v1/attendance/adjustments/my
     * Employee: view their own request history.
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
    @Operation(summary = "Get my attendance adjustment requests (employee view)")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getMyRequests(page, size, principal)));
    }

        /**
         * PUT /api/v1/attendance/adjustments/{id}/resubmit
         * Employee: re-submit a RETURNED_TO_EMPLOYEE request after editing.
         */
        @PutMapping("/{id}/resubmit")
        @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')")
        @Operation(summary = "Resubmit a returned adjustment request")
        public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> resubmit(
                        @PathVariable Long id,
                        @Valid @RequestBody AdjustmentRequestCreateDto dto) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                return ResponseEntity.ok(ApiResponse.success(
                                "Yêu cầu đã được gửi lại.",
                                adjustmentService.resubmit(id, dto, principal)));
        }

        // ─── Manager / HR / Approver endpoints ───────────────────────────────────

    /**
     * GET /api/v1/attendance/adjustments/pending
     * Approver inbox: requests pending the current user's action.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Get pending requests awaiting the current approver's action")
    public ResponseEntity<ApiResponse<PageResponse<AdjustmentRequestSummaryResponse>>> getPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getPendingForApprover(page, size, principal)));
    }

    /**
     * GET /api/v1/attendance/adjustments/{id}
     * Full detail with timeline — accessible to owner employee AND approvers.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST') or hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
    @Operation(summary = "Get full detail of an adjustment request (including audit timeline)")
    public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> getDetail(
            @PathVariable Long id) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success(adjustmentService.getDetail(id, principal)));
    }

        /**
         * POST /api/v1/attendance/adjustments/{id}/approve
         */
        @PostMapping("/{id}/approve")
        @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
        @Operation(summary = "Approve an adjustment request at the current level")
        public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> approve(
                        @PathVariable Long id,
                        @RequestBody ApprovalActionDto dto) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                return ResponseEntity.ok(ApiResponse.success(
                                "Yêu cầu đã được phê duyệt.",
                                adjustmentService.approve(id, dto, principal)));
        }

        /**
         * POST /api/v1/attendance/adjustments/{id}/reject
         * Reason is mandatory — validated at the service layer.
         */
        @PostMapping("/{id}/reject")
        @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
        @Operation(summary = "Reject an adjustment request (reason required)")
        public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> reject(
                        @PathVariable Long id,
                        @Valid @RequestBody ApprovalActionDto dto) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                return ResponseEntity.ok(ApiResponse.success(
                                "Yêu cầu đã bị từ chối.",
                                adjustmentService.reject(id, dto, principal)));
        }

        /**
         * POST /api/v1/attendance/adjustments/{id}/return
         * Reason is mandatory — validated at the service layer.
         */
        @PostMapping("/{id}/return")
        @PreAuthorize("hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')")
        @Operation(summary = "Return an adjustment request to the employee (reason required)")
        public ResponseEntity<ApiResponse<AdjustmentRequestResponse>> returnToEmployee(
                        @PathVariable Long id,
                        @Valid @RequestBody ApprovalActionDto dto) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                return ResponseEntity.ok(ApiResponse.success(
                                "Yêu cầu đã được gửi lại cho nhân viên.",
                                adjustmentService.returnToEmployee(id, dto, principal)));
        }
}
