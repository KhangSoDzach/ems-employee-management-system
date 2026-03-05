package com.company.ems.backend.workflow.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.workflow.enums.AssigneeType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Defines a single approval level within a {@link WorkflowTemplate}.
 *
 * <p>Each level specifies:
 * <ul>
 *   <li>Its position in the chain ({@code levelNumber}, 1-based).
 *   <li>Who approves ({@code assigneeType} + either {@code assigneeRole} or {@code assigneeUser}).
 *   <li>An optional escalation timeout in hours.
 * </ul>
 */
@Entity
@Table(name = "workflow_levels",
       uniqueConstraints = @UniqueConstraint(
               name = "uq_workflow_level_number",
               columnNames = {"template_id", "level_number"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLevel extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private WorkflowTemplate template;

    /** 1-based ordinal of this level in the approval chain. */
    @Min(1) @Max(5)
    @Column(name = "level_number", nullable = false)
    private int levelNumber;

    @NotNull(message = "Assignee type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssigneeType assigneeType;

    /**
     * Role name (e.g. {@code ROLE_MANAGER}) used when {@code assigneeType == ROLE}.
     * Null when {@code assigneeType == USER}.
     */
    @Column(length = 60)
    private String assigneeRole;

    /**
     * Specific user assigned when {@code assigneeType == USER}.
     * Null when {@code assigneeType == ROLE}.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_user_id")
    private User assigneeUser;

    /**
     * Hours after which an escalation reminder is sent (or the level auto-escalates,
     * depending on future implementation).  {@code null} means no escalation.
     */
    @Column
    private Integer timeoutHours;

    @Column(length = 500)
    private String notes;

    // ─── Convenience helpers ──────────────────────────────────────────────────

    /**
     * Returns {@code true} if this level has been soft-deleted.
     * Delegates to the {@link com.company.ems.backend.common.entity.BaseEntity#getIsDeleted()} field
     * inherited from the base class.
     */
    public boolean isDeleted() {
        return Boolean.TRUE.equals(getIsDeleted());
    }
}
