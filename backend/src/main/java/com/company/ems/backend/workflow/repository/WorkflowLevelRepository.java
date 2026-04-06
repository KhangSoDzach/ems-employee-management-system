package com.company.ems.backend.workflow.repository;

import com.company.ems.backend.workflow.entity.WorkflowLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link WorkflowLevel}.
 */
@Repository
public interface WorkflowLevelRepository extends JpaRepository<WorkflowLevel, Long> {

    /**
     * Returns all non-deleted levels for a template, sorted by level number ascending.
     */
    List<WorkflowLevel> findByTemplateIdAndIsDeletedFalseOrderByLevelNumberAsc(Long templateId);

    /**
     * Returns a specific level by template and level number.
     */
    Optional<WorkflowLevel> findByTemplateIdAndLevelNumberAndIsDeletedFalse(
            Long templateId, int levelNumber);
}
