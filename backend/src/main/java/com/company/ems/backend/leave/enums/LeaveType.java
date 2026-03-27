package com.company.ems.backend.leave.enums;

/**
 * Leave type enumeration
 * Defines various types of leave that employees can apply for
 */
public enum LeaveType {
    /**
     * Annual/Vacation leave
     */
    ANNUAL,

    /**
     * Sick leave
     */
    SICK,

    /**
     * Personal leave
     */
    PERSONAL,

    /**
     * Legacy value kept for backward compatibility with historical records.
     * Prefer {@link #PERSONAL} for new writes.
     */
    CASUAL,

    /**
     * Unpaid leave
     */
    UNPAID,

    /**
     * Emergency leave
     */
    EMERGENCY,

    /**
     * Maternity leave
     */
    MATERNITY,

    /**
     * Paternity leave
     */
    PATERNITY,

    /**
     * Bereavement leave
     */
    BEREAVEMENT,

    /**
     * Study leave
     */
    STUDY,

    /**
     * Sabbatical leave
     */
    SABBATICAL,

    /**
     * Compensatory time off
     */
    COMPENSATORY

    ;

    /**
     * Parses leave type input safely and supports legacy aliases.
     */
    public static LeaveType fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Leave type must not be blank");
        }
        String normalized = raw.trim().toUpperCase();
        if ("CASUAL".equals(normalized)) {
            return PERSONAL;
        }
        return LeaveType.valueOf(normalized);
    }

    /**
     * Canonical value for API responses to keep frontend contract stable.
     */
    public String toApiValue() {
        return this == CASUAL ? PERSONAL.name() : this.name();
    }
}
