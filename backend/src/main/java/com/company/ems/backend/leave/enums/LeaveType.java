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
    COMPENSATORY;

    /**
     * Parses a leave type from the given string value case-insensitively.
     *
     * @param type the string representation of leave type
     * @return the LeaveType enum or throws IllegalArgumentException
     */
    public static LeaveType fromRequest(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("Leave type cannot be empty");
        }
        for (LeaveType leaveType : LeaveType.values()) {
            if (leaveType.name().equalsIgnoreCase(type.trim())) {
                return leaveType;
            }
        }
        throw new IllegalArgumentException("Invalid leave type: " + type);
    }
}
