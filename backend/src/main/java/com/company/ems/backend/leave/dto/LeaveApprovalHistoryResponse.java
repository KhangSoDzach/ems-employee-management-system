package com.company.ems.backend.leave.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Read-only DTO representing a single entry in the leave approval audit trail.
 * Returned by {@code GET /api/v1/leaves/{id}/history} (FR-WORKFLOW-007).
 */
@Data
@Builder
public class LeaveApprovalHistoryResponse {

    private Long id;
    private Long leaveId;
    private int approvalLevel;
    private Long approverUserId;
    private String approverName;

    /** Action taken: APPROVE, REJECT, or SEND_BACK. */
    private String action;

    private String comments;
    private LocalDateTime actionAt;

    /** Status of the leave before this action. */
    private String statusBefore;

    /** Status of the leave after this action. */
    private String statusAfter;
}
