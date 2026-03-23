package com.company.ems.backend.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionLocationMappingResponse {
    private Long positionId;
    private String positionCode;
    private String positionTitle;
    private Long departmentId;
    private Long officeLocationId;
    private String officeLocationName;
    private Boolean officeLocationActive;
}
