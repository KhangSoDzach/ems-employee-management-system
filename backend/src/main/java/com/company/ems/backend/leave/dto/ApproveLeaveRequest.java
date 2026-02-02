package com.company.ems.backend.leave.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveLeaveRequest {
    @NotBlank(message = "Status is required")
    private String status; // APPROVED or REJECTED

    private String notes;
}
