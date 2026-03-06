package com.company.ems.backend.leave.enums;

/**
 * Actions that an approver can take on a leave request at any approval level.
 * Used by {@code LeaveApprovalService} to drive the multi-level state machine.
 */
public enum LeaveApprovalAction {

    /**
     * Approves the request at the current level.
     * The request advances to the next level or becomes APPROVED if this is the
     * last level.
     */
    APPROVE,

    /**
     * Rejects the request at the current level.
     * The request immediately moves to REJECTED and the workflow ends.
     */
    REJECT,

    /**
     * Returns the request to the employee for revision.
     * The request moves to RETURNED_TO_EMPLOYEE; the employee can correct and
     * resubmit.
     */
    SEND_BACK
}
