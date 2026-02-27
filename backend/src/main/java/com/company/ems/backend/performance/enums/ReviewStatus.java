package com.company.ems.backend.performance.enums;

/**
 * Review status enumeration
 * Represents the status of a performance review
 */
public enum ReviewStatus {
    /**
     * Review is in draft state
     */
    DRAFT,

    /**
     * Review has been submitted
     */
    SUBMITTED,

    /**
     * Review is under discussion/feedback
     */
    IN_REVIEW,

    /**
     * Review has been completed and approved
     */
    COMPLETED,

    /**
     * Review has been cancelled
     */
    CANCELLED
}
