package com.company.ems.backend.workflow.enums;

/**
 * Determines how the approver for a workflow level is identified.
 */
public enum AssigneeType {

    /**
     * Any user holding the specified {@code assigneeRole} (e.g. ROLE_MANAGER)
     * may approve at this level.
     */
    ROLE,

    /**
     * Only the specific user identified by {@code assigneeUserId} may approve
     * at this level.
     */
    USER
}
