package com.company.ems.backend.workflow.repository;

import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.WorkflowType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link WorkflowTemplate}.
 */
@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, Long> {

    /**
     * Returns the currently active template for the given workflow type.
     *
     * <p>At most one active, non-deleted template per type should exist.
     */
    Optional<WorkflowTemplate> findByWorkflowTypeAndIsActiveTrueAndIsDeletedFalse(WorkflowType workflowType);

    /**
     * Check whether an active template already exists for a given workflow type.
     */
    boolean existsByWorkflowTypeAndIsActiveTrueAndIsDeletedFalse(WorkflowType workflowType);
}
