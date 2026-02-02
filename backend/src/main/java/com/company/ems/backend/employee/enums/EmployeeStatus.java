package com.company.ems.backend.employee.enums;

/**
 * Employee status enumeration
 * Represents the current employment status of an employee
 */
public enum EmployeeStatus {
    /**
     * Employee is actively working
     */
    ACTIVE,

    /**
     * Employee is temporarily inactive (on long leave, suspended, etc.)
     */
    INACTIVE,

    /**
     * Employee is in probation period
     */
    ON_PROBATION,

    /**
     * Employee is currently on leave
     */
    ON_LEAVE,

    /**
     * Employee has been terminated by company
     */
    TERMINATED,

    /**
     * Employee has resigned voluntarily
     */
    RESIGNED,
    /**
     * Employee has been fired by company
     */
    FIRED,
}
