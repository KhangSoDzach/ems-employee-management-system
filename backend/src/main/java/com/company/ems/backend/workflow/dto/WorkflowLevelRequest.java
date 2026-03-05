package com.company.ems.backend.workflow.dto;

import com.company.ems.backend.workflow.enums.AssigneeType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request payload for creating or updating a single workflow level. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLevelRequest {

    @Min(1) @Max(5)
    @NotNull(message = "Level number is required")
    private Integer levelNumber;

    @NotNull(message = "Assignee type is required")
    private AssigneeType assigneeType;

    /** Required when assigneeType == ROLE (e.g. ROLE_MANAGER). */
    private String assigneeRole;

    /** Required when assigneeType == USER. */
    private Long assigneeUserId;

    /** Hours before escalation reminder (optional). */
    private Integer timeoutHours;

    private String notes;
}
