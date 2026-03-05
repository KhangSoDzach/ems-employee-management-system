package com.company.ems.backend.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the POST /api/v1/attendance/check-out endpoint.
 *
 * <p>employeeId is resolved server-side from the JWT principal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckOutRequest {

    /** WGS-84 latitude captured by the browser Geolocation API. */
    @NotNull(message = "Latitude is required")
    private Double latitude;

    /** WGS-84 longitude captured by the browser Geolocation API. */
    @NotNull(message = "Longitude is required")
    private Double longitude;

    /**
     * Base64-encoded JPEG/PNG image captured from the device camera.
     * Must start with a data-URL prefix or be a raw Base64 string.
     */
    @NotNull(message = "Photo is required for camera check-out")
    private String photoBase64;

    /** Human-readable location label (optional). */
    private String locationLabel;

    /** Optional notes from the employee. */
    private String notes;

    // ── System metadata set by the controller / interceptor ──────────────────

    /** IP address (set server-side). */
    private String ipAddress;

    /** User-Agent header (set server-side). */
    private String userAgent;

    /** Device info (set server-side). */
    private String deviceInfo;
}
