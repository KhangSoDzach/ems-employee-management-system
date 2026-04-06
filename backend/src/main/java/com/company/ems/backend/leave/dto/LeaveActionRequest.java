package com.company.ems.backend.leave.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Adapter DTO to match frontend action payloads.
 * Example: { action: 'APPROVE' | 'REJECT' | 'SEND_BACK', comments: '...' }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveActionRequest {
    @NotBlank(message = "Action is required")
    private String action;

    private String comments;
}
