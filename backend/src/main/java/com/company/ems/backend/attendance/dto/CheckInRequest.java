package com.company.ems.backend.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {
    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private String location;
    private Double latitude;
    private Double longitude;
    private String notes;

    @Builder.Default
    private LocalDateTime checkInTime = LocalDateTime.now();
}
