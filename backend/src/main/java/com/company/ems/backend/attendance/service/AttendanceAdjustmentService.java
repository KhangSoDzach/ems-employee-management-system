package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestCreateDto;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.ApprovalActionDto;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;

/**
 * Service interface for the Manual Attendance Adjustment request lifecycle.
 *
 * <h3>State machine summary</h3>
 * <pre>
 *   submitRequest()     → PENDING_LEVEL_1
 *   approve()           → PENDING_LEVEL_(N+1)  OR  APPROVED (last level)
 *   reject()            → REJECTED
 *   returnToEmployee()  → RETURNED_TO_EMPLOYEE
 *   resubmit()          → PENDING_LEVEL_1
 * </pre>
 */
public interface AttendanceAdjustmentService {

    // ─── Employee actions ─────────────────────────────────────────────────────

    /**
     * Creates and submits a new attendance adjustment request.
     *
     * @param dto       validated request payload from the employee
     * @param principal the authenticated employee
     * @return the created request
     */
    AdjustmentRequestResponse submitRequest(AdjustmentRequestCreateDto dto,
                                            CustomUserPrincipal principal);

    /**
     * Resubmits a request that was previously returned to the employee.
     * Only allowed when the request is in {@code RETURNED_TO_EMPLOYEE} state.
     *
     * @param requestId the ID of the original request
     * @param dto       updated payload
     * @param principal the authenticated employee (must own the request)
     */
    AdjustmentRequestResponse resubmit(Long requestId,
                                       AdjustmentRequestCreateDto dto,
                                       CustomUserPrincipal principal);

    // ─── Approver actions ─────────────────────────────────────────────────────

    /**
     * Approves the request at the current level.
     * If this is the last level, the status transitions to {@code APPROVED} and
     * the corresponding attendance record is updated automatically.
     *
     * @param requestId the request to approve
     * @param dto       optional comment
     * @param principal the approving user
     */
    AdjustmentRequestResponse approve(Long requestId,
                                      ApprovalActionDto dto,
                                      CustomUserPrincipal principal);

    /**
     * Rejects the request.  {@code dto.reason} is mandatory.
     *
     * @param requestId the request to reject
     * @param dto       rejection reason (required)
     * @param principal the rejecting user
     */
    AdjustmentRequestResponse reject(Long requestId,
                                     ApprovalActionDto dto,
                                     CustomUserPrincipal principal);

    /**
     * Returns the request to the employee for correction.  {@code dto.reason} is mandatory.
     *
     * @param requestId the request to return
     * @param dto       reason for returning (required)
     * @param principal the user sending it back
     */
    AdjustmentRequestResponse returnToEmployee(Long requestId,
                                               ApprovalActionDto dto,
                                               CustomUserPrincipal principal);

    // ─── Query methods ────────────────────────────────────────────────────────

    /**
     * Returns a paginated list of the authenticated employee's own requests.
     */
    PageResponse<AdjustmentRequestSummaryResponse> getMyRequests(
            int page, int size, CustomUserPrincipal principal);

    /**
     * Returns the approver inbox with both currently pending requests and
     * requests this approver has already processed (approval history view).
     */
    PageResponse<AdjustmentRequestSummaryResponse> getPendingForApprover(
            int page, int size, CustomUserPrincipal principal);

    /**
     * Returns the full detail of a single request, including the audit trail.
     * Access is enforced: employees can only view their own requests.
     */
    AdjustmentRequestResponse getDetail(Long requestId, CustomUserPrincipal principal);
}
