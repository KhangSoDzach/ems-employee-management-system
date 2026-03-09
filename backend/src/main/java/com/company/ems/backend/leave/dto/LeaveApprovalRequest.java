package com.company.ems.backend.leave.dto;

import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for approver actions (APPROVE / REJECT / SEND_BACK).
 * Replaces the old {@link ApproveLeaveRequest} for multi-level flows.
 */
@Data
public class LeaveApprovalRequest {

    @NotNull(message = "Action is required: APPROVE, REJECT, or SEND_BACK")
    private LeaveApprovalAction action;

    @Size(max = 2000, message = "Comments must not exceed 2000 characters")
    private String comments;
}
