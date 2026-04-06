package com.company.ems.backend.attendance.enums;

/**
 * Reason type codes for a manual attendance adjustment request.
 *
 * <p>These map to the selectable options shown to the employee in the UI form.
 * The employee also provides a free-text {@code reasonText} for additional detail.
 */
public enum AdjustmentReason {

    /** Device (PC / mobile) failed; could not capture geolocation or camera. */
    DEVICE_ERROR,

    /** Employee forgot to check in. */
    FORGOT_CHECKIN,

    /** Employee forgot to check out. */
    FORGOT_CHECKOUT,

    /** Internal system error (backend rejected or lost the check-in event). */
    SYSTEM_ERROR,

    /** Any other reason not covered by the above categories. */
    OTHER
}
