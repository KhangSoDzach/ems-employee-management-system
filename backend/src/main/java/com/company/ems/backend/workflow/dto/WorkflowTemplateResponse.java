package com.company.ems.backend.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** Response DTO for a workflow template including its levels. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateResponse {
    private Long                      id;
    private String                    name;
    private String                    workflowType;
    private String                    description;
    private boolean                   isActive;
    private int                       totalLevels;
    private List<WorkflowLevelResponse> levels;
    private LocalDateTime             createdAt;
    private LocalDateTime             updatedAt;
}
