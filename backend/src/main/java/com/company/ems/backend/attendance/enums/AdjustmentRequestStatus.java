package com.company.ems.backend.attendance.enums;

/**
 * Lifecycle states for a Manual Attendance Adjustment Request.
 *
 * <p>State diagram:
 * <pre>
 *   [Submit]
 *      │
 *      ▼
 *  PENDING_LEVEL_1 ──► PENDING_LEVEL_2 ──► … ──► PENDING_LEVEL_5
 *      │  (each level: Approve / Reject / Return)
 *      ├── APPROVED                (final — all levels approved)
 *      ├── REJECTED                (final — rejected at any level)
 *      └── RETURNED_TO_EMPLOYEE   (employee edits & resubmits → PENDING_LEVEL_1)
 * </pre>
 */
public enum AdjustmentRequestStatus {

    /** Awaiting approval at level 1 (initial state after submit/resubmit). */
    PENDING_LEVEL_1,

    /** Awaiting approval at level 2. */
    PENDING_LEVEL_2,

    /** Awaiting approval at level 3. */
    PENDING_LEVEL_3,

    /** Awaiting approval at level 4. */
    PENDING_LEVEL_4,

    /** Awaiting approval at level 5. */
    PENDING_LEVEL_5,

    /** Fully approved — attendance record has been updated. */
    APPROVED,

    /** Rejected at one of the approval levels (terminal state). */
    REJECTED,

    /**
     * Returned to the employee for correction/clarification.
     * The employee can edit and resubmit, which resets the state to PENDING_LEVEL_1.
     */
    RETURNED_TO_EMPLOYEE;

    /** Returns {@code true} if this status represents a terminal (non-modifiable) state. */
    public boolean isTerminal() {
        return this == APPROVED || this == REJECTED;
    }

    /**
     * Returns the next pending level status after the current one has been approved,
     * or {@code null} if this is the last level (caller should transition to APPROVED).
     */
    public AdjustmentRequestStatus nextLevel() {
        return switch (this) {
            case PENDING_LEVEL_1 -> PENDING_LEVEL_2;
            case PENDING_LEVEL_2 -> PENDING_LEVEL_3;
            case PENDING_LEVEL_3 -> PENDING_LEVEL_4;
            case PENDING_LEVEL_4 -> PENDING_LEVEL_5;
            default              -> null; // PENDING_LEVEL_5 or any terminal state
        };
    }

    /**
     * Converts a 1-based integer level number to the corresponding pending status.
     *
     * @throws IllegalArgumentException for levels outside 1–5
     */
    public static AdjustmentRequestStatus pendingForLevel(int level) {
        return switch (level) {
            case 1 -> PENDING_LEVEL_1;
            case 2 -> PENDING_LEVEL_2;
            case 3 -> PENDING_LEVEL_3;
            case 4 -> PENDING_LEVEL_4;
            case 5 -> PENDING_LEVEL_5;
            default -> throw new IllegalArgumentException("Approval level must be between 1 and 5, got: " + level);
        };
    }

    /** Returns {@code true} if this is one of the PENDING_LEVEL_N states. */
    public boolean isPending() {
        return this == PENDING_LEVEL_1 || this == PENDING_LEVEL_2
            || this == PENDING_LEVEL_3 || this == PENDING_LEVEL_4
            || this == PENDING_LEVEL_5;
    }
}
