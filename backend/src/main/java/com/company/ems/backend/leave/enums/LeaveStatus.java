package com.company.ems.backend.leave.enums;
public enum LeaveStatus {

    // ─── Legacy (pre-V12) ────────────────────────────────────────────────────

    /**
     * @deprecated Migrated to PENDING_LEVEL_1 by V12. Kept for legacy
     *             compatibility.
     */
    @Deprecated
    PENDING,

    /** @deprecated Retained for historical records only. */
    @Deprecated
    WITHDRAWN,

    // ─── Multi-level pending states ──────────────────────────────────────────

    /** Awaiting Level-1 approver action. */
    PENDING_LEVEL_1,

    /** Awaiting Level-2 approver action (e.g., HR for long leaves). */
    PENDING_LEVEL_2,

    /** Awaiting Level-3 approver action. */
    // PENDING_LEVEL_3,

    // /** Awaiting Level-4 approver action. */
    // PENDING_LEVEL_4,

    // /** Awaiting Level-5 approver action. */
    // PENDING_LEVEL_5,

    // ─── Terminal states ─────────────────────────────────────────────────────

    /** All approval levels approved — leave is granted. */
    APPROVED,

    /** Rejected by an approver at any level. */
    REJECTED,

    /** Returned to employee for revision (SEND_BACK action). */
    RETURNED_TO_EMPLOYEE,

    /** Cancelled by the employee (only allowed on pending requests). */
    CANCELLED;

    /** Returns true if this status represents any pending-level waiting state. */
    public boolean isPending() {
        return this == PENDING_LEVEL_1
                || this == PENDING_LEVEL_2
                // || this == PENDING_LEVEL_3
                // || this == PENDING_LEVEL_4
                // || this == PENDING_LEVEL_5
                || this == PENDING; // legacy
    }

    /**
     * Returns the {@code PENDING_LEVEL_N} status for the given 1-based level
     * number.
     *
     * @throws IllegalArgumentException if levelNumber is outside [1,5]
     */
    public static LeaveStatus pendingForLevel(int levelNumber) {
        return switch (levelNumber) {
            case 1 -> PENDING_LEVEL_1;
            case 2 -> PENDING_LEVEL_2;
            // case 3 -> PENDING_LEVEL_3;
            // case 4 -> PENDING_LEVEL_4;
            // case 5 -> PENDING_LEVEL_5;
            default -> throw new IllegalArgumentException(
                    "Approval level must be between 1 and 5, got: " + levelNumber);
        };
    }
}
