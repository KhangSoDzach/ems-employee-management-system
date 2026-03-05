package com.company.ems.backend.attendance.dto.adjustment;

import com.company.ems.backend.attendance.enums.AdjustmentReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Payload for submitting or resubmitting a manual attendance adjustment request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustmentRequestCreateDto {

    /** The date of the attendance record to be corrected. */
    @NotNull(message = "Request date is required")
    private LocalDate requestDate;

    /**
     * Proposed corrected check-in time.
     * At least one of {@code proposedCheckInTime} or {@code proposedCheckOutTime} must be present.
     */
    private LocalDateTime proposedCheckInTime;

    /** Proposed corrected check-out time. */
    private LocalDateTime proposedCheckOutTime;

    /** Structured reason type (from a predefined list). */
    @NotNull(message = "Reason type is required")
    private AdjustmentReason reasonType;

    /** Free-text explanation (mandatory per AC). */
    @NotBlank(message = "Reason text is required")
    @Size(min = 10, max = 2000, message = "Reason text must be between 10 and 2000 characters")
    private String reasonText;

    // ─── System metadata collected at incident time ────────────────────────

    /**
     * Last known geolocation log at the time the incident occurred, as a JSON string.
     * Set by the frontend when geolocation was partially available.
     */
    private String incidentGeoLog;

    /**
     * Photo captured at incident time (Base64). Server will store this and record the path.
     */
    private String incidentPhotoBase64;

    /**
     * Whether the frontend reports that it could not capture geo/photo data.
     * When {@code true}, the backend sets {@code requiresManualReview = true} on the request.
     */
    @Builder.Default
    private boolean reportsMissingGeoOrPhoto = false;
}
