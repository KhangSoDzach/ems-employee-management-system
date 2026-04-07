package com.company.ems.backend.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for a single workflow level. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLevelResponse {
    private Long    id;
    private int     levelNumber;
    private String  assigneeType;
    private String  assigneeRole;
    private Long    assigneeUserId;
    private String  assigneeUserName;
    private Integer timeoutHours;
    private String  notes;
}
