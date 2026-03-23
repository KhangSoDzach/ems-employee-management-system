package com.company.ems.backend.position.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponse {
    private Long id;
    private String title;
    private String code;
    private Long departmentId;
    private Long officeLocationId;
    private String officeLocationName;
    private Integer level; // 1=junior, 2=senior, 3=manager — used by frontend to show/hide manager
                           // dropdown
}
