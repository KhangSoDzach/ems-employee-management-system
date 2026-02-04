package com.company.ems.backend.payroll.enums;

/**
 * Payroll status enumeration
 * Represents the processing status of monthly payroll
 */
public enum PayrollStatus {
    /**
     * Payroll is in draft state, not yet finalized
     */
    DRAFT,

    /**
     * Payroll has been processed and calculations completed
     */
    PROCESSED,

    /**
     * Payroll has been paid to employee
     */
    PAID,

    /**
     * Payroll has been finalized
     */
    FINALIZED,
    
    /**
     * Payroll has been cancelled
     */
    CANCELLED
}
