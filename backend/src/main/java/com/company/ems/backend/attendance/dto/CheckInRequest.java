package com.company.ems.backend.attendance.dto;

import com.company.ems.backend.attendance.enums.CheckInMethod;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the POST /api/v1/attendance/check-in endpoint.
 *
 * <p>employeeId is resolved server-side from the JWT principal;
 * the client does NOT send it.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

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
    @NotNull(message = "Photo is required for camera check-in")
    private String photoBase64;

    /** Human-readable location label (optional, e.g. from reverse-geocoding). */
    private String locationLabel;

    /** Check-in method (defaults to CAMERA_GEO if not provided). */
    @Builder.Default
    private CheckInMethod checkInMethod = CheckInMethod.CAMERA_GEO;

    /** Optional notes from the employee. */
    private String notes;

    // ── System metadata set by the controller / interceptor ──────────────

    /** IP address of the request (set server-side, NOT by client). */
    private String ipAddress;

    /** User-Agent header string (set server-side). */
    private String userAgent;

    /** Device info string (set server-side or forwarded from client). */
    private String deviceInfo;
}
