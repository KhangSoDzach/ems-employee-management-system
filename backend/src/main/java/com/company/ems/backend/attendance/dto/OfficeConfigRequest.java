package com.company.ems.backend.attendance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for admin to configure office GPS location.
 *
 * <p>
 * Used for both manual entry and auto-capture endpoints.
 * For the <em>auto</em> endpoint, {@code radiusMeters} is optional
 * (the existing value is retained if not supplied).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeConfigRequest {

    /** WGS-84 latitude of the office (−90 to +90). */
    @NotNull(message = "Latitude là bắt buộc")
    @DecimalMin(value = "-90.0", message = "Latitude phải >= -90")
    @DecimalMax(value = "90.0", message = "Latitude phải <= 90")
    private Double latitude;

    /** WGS-84 longitude of the office (−180 to +180). */
    @NotNull(message = "Longitude là bắt buộc")
    @DecimalMin(value = "-180.0", message = "Longitude phải >= -180")
    @DecimalMax(value = "180.0", message = "Longitude phải <= 180")
    private Double longitude;

    /**
     * Allowed check-in radius in metres. Optional for the auto endpoint;
     * required for the manual endpoint.
     */
    @Positive(message = "Bán kính phải là số dương")
    private Double radiusMeters;
}
