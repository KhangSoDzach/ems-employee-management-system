package com.company.ems.backend.attendance.enums;

/**
 * Attendance status enumeration
 * Represents the status of daily employee attendance
 */
public enum AttendanceStatus {
    /**
     * Employee is present
     */
    PRESENT,

    /**
     * Employee is absent without leave
     */
    ABSENT,

    /**
     * Employee arrived late
     */
    LATE,

    /**
     * Employee worked half day only
     */
    HALF_DAY,

    /**
     * Employee is on approved leave
     */
    ON_LEAVE,

    /**
     * Weekend day
     */
//    WEEKEND,

    /**
     * Public holiday
     */
    HOLIDAY,

    /**
     * Working remotely/from home
     */
    REMOTE
}
