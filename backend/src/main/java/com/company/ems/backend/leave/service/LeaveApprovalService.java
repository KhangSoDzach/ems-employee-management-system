package com.company.ems.backend.leave.service;

import com.company.ems.backend.leave.dto.LeaveApprovalHistoryResponse;
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;

import java.util.List;

/**
 * Drives the multi-level approval state machine for leave requests.
 *
 * <p>
 * All methods are transactional and log the outcome to
 * {@code leave_approval_histories}.
 */
public interface LeaveApprovalService {

    /**
     * Processes an approver action (APPROVE / REJECT / SEND_BACK) on a leave
     * request.
     *
     * @param leaveId    ID of the leave request
     * @param approverId User ID of the acting approver
     * @param request    DTO containing action + optional comments
     * @return the updated leave response
     */
    LeaveResponse processApproval(Long leaveId, Long approverId, LeaveApprovalRequest request);

    /**
     * Returns the full approval history for a leave request (FR-WORKFLOW-007).
     *
     * @param leaveId ID of the leave request
     * @return chronologically ordered list of history entries
     */
    List<LeaveApprovalHistoryResponse> getHistory(Long leaveId);
}
