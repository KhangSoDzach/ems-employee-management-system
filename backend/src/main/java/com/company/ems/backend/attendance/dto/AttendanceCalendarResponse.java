package com.company.ems.backend.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceCalendarResponse {

    private Long employeeId;
    private String employeeName;
    private String month;

    private AttendanceMetric fullWorkDays;
    private AttendanceMetric lateDays;
    private AttendanceMetric noClockOutDays;
    private AttendanceMetric absentDays;

    private List<CalendarDay> days;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceMetric {
        private Integer current;
        private Double changePercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarDay {
        private LocalDate date;
        private Boolean hasRecord;
        private String status;
        private LocalDateTime checkInTime;
        private LocalDateTime checkOutTime;
        private Integer workHours;
        private Boolean isLate;
        private Boolean missingClockOut;
        private String checkInMethod;
        private String notes;
    }
}
