package com.company.ems.backend.leave.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for a single leave balance entry.
 * Formula: remainingDays = (totalDays + carriedForwardDays) - usedDays
 */
@Data
@Builder
public class LeaveBalanceResponse {
    private Long id;
    private Long employeeId;
    private String leaveType;
    private Integer year;
    private Integer totalDays;
    private Integer usedDays;
    private Integer remainingDays;
    private Integer carriedForwardDays;
}
