package com.company.ems.backend.performance.review.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class OneOnOneMeetingDto {
    private OneOnOneMeetingDto() {}

    @Data
    public static class CreateRequest {
        @NotNull(message = "employeeId không được để trống")
        private Long employeeId;

        @NotNull(message = "meetingDate không được để trống")
        private LocalDate meetingDate;

        private String agenda;
        private String notes;
        private String actionItems;
        private LocalDate nextMeetingDate;
    }

    @Data
    @Builder
    public static class Response {
        private Long      id;
        private Long      managerId;
        private String    managerName;
        private Long      employeeId;
        private String    employeeName;
        private LocalDate meetingDate;
        private String    agenda;
        private String    notes;
        private String    actionItems;
        private LocalDate nextMeetingDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}