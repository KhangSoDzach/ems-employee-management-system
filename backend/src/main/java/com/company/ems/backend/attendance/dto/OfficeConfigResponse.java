package com.company.ems.backend.attendance.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    /** Shift 1 check-in time (HH:mm) */
    private String shift1CheckIn;

    /** Shift 1 check-out time (HH:mm) */
    private String shift1CheckOut;

    /** Shift 2 check-in time (HH:mm) */
    private String shift2CheckIn;

    /** Shift 2 check-out time (HH:mm) */
    private String shift2CheckOut;

    /** Grace period in minutes */
    private Integer gracePeriod;

    /** Early leave threshold in minutes */
    private Integer earlyLeaveThreshold;
}
