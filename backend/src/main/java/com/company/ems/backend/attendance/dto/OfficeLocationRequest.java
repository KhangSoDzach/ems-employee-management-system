package com.company.ems.backend.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeLocationRequest {

    @NotBlank(message = "Tên văn phòng không được để trống")
    private String name;

    @NotNull(message = "Vĩ độ không được để trống")
    private Double latitude;

    @NotNull(message = "Kinh độ không được để trống")
    private Double longitude;

    @NotNull(message = "Bán kính không được để trống")
    private Double radiusMeters;

    private String address;

    private Boolean isActive;
}
