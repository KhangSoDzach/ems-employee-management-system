package com.company.ems.backend.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing the current office location configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeConfigResponse {

    /** WGS-84 latitude of the configured office location. */
    private Double latitude;

    /** WGS-84 longitude of the configured office location. */
    private Double longitude;

    /** Allowed check-in radius in metres. */
    private Double radiusMeters;

    /**
     * Timestamp of the last update. {@code null} if never updated via API (YAML
     * default).
     */
    private LocalDateTime updatedAt;

    /**
     * Username of the admin who last updated the config. {@code null} if YAML
     * default.
     */
    private String updatedBy;

    /**
     * Source of the current configuration.
     * {@code "DATABASE"} if overridden via API; {@code "YAML_DEFAULT"} if using
     * application.yaml values.
     */
    private String source;
}
