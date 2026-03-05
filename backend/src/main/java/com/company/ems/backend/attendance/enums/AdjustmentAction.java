package com.company.ems.backend.attendance.enums;

/**
 * Represents an action performed on an {@link com.company.ems.backend.attendance.entity.AttendanceAdjustmentRequest}
 * during its lifecycle.  Each action generates one immutable history record.
 */
public enum AdjustmentAction {

    /** Employee submitted a new request. */
    SUBMITTED,

    /** Employee resubmitted a RETURNED_TO_EMPLOYEE request after editing. */
    RESUBMITTED,

    /** An approver approved the request at level N (stored in {@code levelActedOn}). */
    APPROVED,

    /** An approver rejected the request at level N. */
    REJECTED,

    /** An approver returned the request to the employee for correction. */
    RETURNED_TO_EMPLOYEE,

    /**
     * The approved adjustment was applied to the corresponding {@link com.company.ems.backend.attendance.entity.Attendance} record.
     * Recorded automatically by the system after the final approval.
     */
    APPLIED_TO_ATTENDANCE
}
