package com.company.ems.backend.workflow.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.workflow.enums.WorkflowType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Defines a named, versioned approval workflow for a specific business process.
 *
 * <p>At most one {@code WorkflowTemplate} per {@link WorkflowType} should be
 * {@code isActive = true} at any given time.  The system picks the active template
 * when a new request is submitted.
 */
@Entity
@Table(name = "workflow_templates", indexes = {
        @Index(name = "idx_workflow_templates_type", columnList = "workflow_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplate extends BaseEntity {

    @NotBlank(message = "Template name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @NotNull(message = "Workflow type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private WorkflowType workflowType;

    @Column(length = 500)
    private String description;

    /** Only one active template per workflow type should exist at a time. */
    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    /**
     * Ordered list of approval levels for this template.
     * Cascade is intentional: levels are created/updated together with the template.
     */
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("levelNumber ASC")
    @Builder.Default
    private List<WorkflowLevel> levels = new ArrayList<>();

    // ─── Convenience helpers ──────────────────────────────────────────────────

    /** Returns the total number of approval levels in this template. */
    public int getTotalLevels() {
        return levels != null ? (int) levels.stream().filter(l -> !l.isDeleted()).count() : 0;
    }
}
