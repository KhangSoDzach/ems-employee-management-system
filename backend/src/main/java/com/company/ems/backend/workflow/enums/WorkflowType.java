package com.company.ems.backend.workflow.enums;

/**
 * Identifies the business process a workflow template governs.
 *
 * <p>Designed to be extendable: future process types (e.g. LEAVE_APPROVAL,
 * EXPENSE_CLAIM) can be added here without schema changes.
 */
public enum WorkflowType {

    /**
     * Multi-level approval workflow for manual attendance adjustment requests
     * submitted by employees.
     */
    MANUAL_ATTENDANCE_ADJUSTMENT
}
