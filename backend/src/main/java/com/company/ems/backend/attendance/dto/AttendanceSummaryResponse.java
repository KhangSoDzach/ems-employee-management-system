package com.company.ems.backend.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryResponse {
    private Long employeeId;
    private String employeeName;
    private Integer totalDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer lateDays;
    private Integer halfDays;
    private Double attendancePercentage;
    private Integer totalWorkHours;
}
