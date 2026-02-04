package com.company.ems.backend.leave.enums;

/**
 * Leave status enumeration
 * Represents the current status of a leave request
 */
public enum LeaveStatus {
    /**
     * Leave request is pending approval
     */
    PENDING,

    /**
     * Leave request has been approved
     */
    APPROVED,

    /**
     * Leave request has been rejected
     */
    REJECTED,

    /**
     * Leave request has been cancelled
     */
    CANCELLED,

    /**
     * Leave request has been withdrawn by employee
     */
    WITHDRAWN
}
