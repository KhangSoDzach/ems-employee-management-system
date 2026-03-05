package com.company.ems.backend.workflow.service;

import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.WorkflowType;

import java.util.List;
import java.util.Optional;

/**
 * Domain service for querying workflow templates and levels.
 *
 * <p>This service is responsible for retrieving the active workflow configuration;
 * state transitions are performed by the consuming service
 * (e.g. {@link com.company.ems.backend.attendance.service.AttendanceAdjustmentService}).
 */
public interface WorkflowEngineService {

    /**
     * Returns the currently active {@link WorkflowTemplate} for the given type.
     *
     * @param workflowType the type of process
     * @return the active template
     * @throws com.company.ems.backend.common.exception.BusinessException
     *         if no active template exists for the given type
     */
    WorkflowTemplate getActiveTemplate(WorkflowType workflowType);

    /**
     * Returns all non-deleted levels of the template, ordered by {@code levelNumber} ascending.
     * The result is used to determine how many approval steps are required.
     */
    List<WorkflowLevel> getLevels(WorkflowTemplate template);

    /**
     * Returns the {@link WorkflowLevel} definition for a specific level number within a template.
     *
     * @param template    the workflow template
     * @param levelNumber the 1-based level number
     * @return an {@link Optional} containing the level, or empty if not found / deleted
     */
    Optional<WorkflowLevel> getLevel(WorkflowTemplate template, int levelNumber);

    /**
     * Determines the User IDs of all users who can act as approvers at the given level.
     *
     * <p>If the level uses {@code ROLE} assignee type, this resolves all active users
     * holding that role.  If the level uses {@code USER} assignee type, the specific
     * user's ID is returned directly.
     *
     * @param level the workflow level whose approvers to resolve
     * @return list of user IDs who may approve at this level; never null, may be empty
     */
    List<Long> resolveApproverUserIds(WorkflowLevel level);
}
