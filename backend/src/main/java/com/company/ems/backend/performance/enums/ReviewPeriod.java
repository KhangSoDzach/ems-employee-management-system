package com.company.ems.backend.performance.enums;

/**
 * Review period enumeration
 * Defines the frequency/period of performance reviews
 */
public enum ReviewPeriod {
    /**
     * Quarterly review (every 3 months)
     */
    QUARTERLY,

    /**
     * Semi-annual review (every 6 months)
     */
    SEMI_ANNUAL,

    /**
     * Annual review (yearly)
     */
    ANNUAL,

    /**
     * Probation review
     * Đánh giá thử việc
     */
    PROBATION,

    /**
     * Ad-hoc/special review
     * Đánh giá đặc biệt/đột xuất
     */
    AD_HOC
}
