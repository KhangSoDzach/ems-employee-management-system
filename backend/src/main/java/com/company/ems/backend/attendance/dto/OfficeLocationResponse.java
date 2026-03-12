package com.company.ems.backend.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeLocationResponse {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Double radiusMeters;
    private String address;
    private Boolean isActive;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
