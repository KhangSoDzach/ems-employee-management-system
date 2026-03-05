package com.company.ems.backend.workflow.service;

import com.company.ems.backend.workflow.dto.WorkflowTemplateRequest;
import com.company.ems.backend.workflow.dto.WorkflowTemplateResponse;
import com.company.ems.backend.workflow.dto.WorkflowLevelRequest;
import com.company.ems.backend.workflow.dto.WorkflowLevelResponse;

import java.util.List;

/**
 * Admin-facing service for managing workflow templates and their levels.
 *
 * <p>All mutating operations deactivate any previous active template of the
 * same type and ensure level ordinals are contiguous and unique.
 */
public interface WorkflowAdminService {

    /** Returns all non-deleted templates, ordered by workflowType then name. */
    List<WorkflowTemplateResponse> getAll();

    /** Returns a single template by id (including its levels). */
    WorkflowTemplateResponse getById(Long templateId);

    /**
     * Creates a new template.
     * If {@code request.isActive} is {@code true}, any existing active template
     * for the same {@link com.company.ems.backend.workflow.enums.WorkflowType} is
     * automatically deactivated.
     */
    WorkflowTemplateResponse createTemplate(WorkflowTemplateRequest request);

    /**
     * Updates an existing template's header fields and replaces its level set.
     * The previous full level list is removed (orphan-removal) and the new list
     * from {@code request.levels} is persisted in order.
     */
    WorkflowTemplateResponse updateTemplate(Long templateId, WorkflowTemplateRequest request);

    /** Soft-deletes a template and all its levels. */
    void deleteTemplate(Long templateId);

    /** Adds a new level to an existing template. */
    WorkflowLevelResponse addLevel(Long templateId, WorkflowLevelRequest request);

    /** Updates an existing level (identified by levelId). */
    WorkflowLevelResponse updateLevel(Long templateId, Long levelId, WorkflowLevelRequest request);

    /** Soft-deletes a single level from a template. */
    void deleteLevel(Long templateId, Long levelId);
}
