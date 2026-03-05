package com.company.ems.backend.workflow.dto;

import com.company.ems.backend.workflow.enums.WorkflowType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Request payload for creating or updating a workflow template. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateRequest {

    @NotBlank(message = "Template name is required")
    private String name;

    @NotNull(message = "Workflow type is required")
    private WorkflowType workflowType;

    private String description;

    @Builder.Default
    private boolean isActive = true;

    @Valid
    private List<WorkflowLevelRequest> levels;
}
