package com.company.ems.backend.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionLocationMappingRequest {

    @NotNull(message = "officeLocationId không được để trống")
    private Long officeLocationId;
}
