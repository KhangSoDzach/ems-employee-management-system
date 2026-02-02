package com.company.ems.backend.attendance.enums;

/**
 * Check-in method enumeration
 * Defines how employee checked in for attendance
 */
public enum CheckInMethod {
    /**
     * Checked in via web browser
     */
    WEB,

    /**
     * Checked in via mobile app
     */
    MOBILE,

    /**
     * Checked in via biometric device (fingerprint, face recognition)
     */
    BIOMETRIC,

    /**
     * Checked in via RFID card
     */
    RFID,

    /**
     * Manually entered by HR/manager
     */
    MANUAL
}
