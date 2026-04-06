package com.company.ems.backend.attendance.dto.adjustment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full detail response for a single attendance adjustment request.
 * Includes all metadata and the complete audit timeline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustmentRequestResponse {

    private Long   id;

    // ─── Employee info ────────────────────────────────────────────────────────
    private Long   employeeId;
    private String employeeName;
    private String employeeCode;

    // ─── Attendance being corrected ───────────────────────────────────────────
    private Long          attendanceId;
    private LocalDate     requestDate;
    private LocalDateTime proposedCheckInTime;
    private LocalDateTime proposedCheckOutTime;

    // ─── Reason ───────────────────────────────────────────────────────────────
    private String reasonType;    // enum name
    private String reasonText;

    // ─── Workflow state ───────────────────────────────────────────────────────
    private String status;        // enum name — for badge colour in UI
    private int    currentApprovalLevel;
    private int    maxApprovalLevel;

    // ─── Manual review flag ───────────────────────────────────────────────────
    /** True when geo/photo is missing — manager should apply extra scrutiny. */
    private boolean requiresManualReview;

    // ─── Incident metadata ────────────────────────────────────────────────────
    private String incidentIpAddress;
    private String incidentDeviceInfo;
    private String incidentUserAgent;
    private String incidentGeoLog;
    private String incidentPhotoUrl;

    // ─── Resolution ───────────────────────────────────────────────────────────
    private LocalDateTime resolvedAt;
    private String        resolvedByName;

    // ─── Audit / timestamps ───────────────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── Timeline (approver view + employee history view) ─────────────────────
    /** Ordered chronologically — drives the timeline section in the UI. */
    private List<AttendanceAdjustmentHistoryResponse> history;
}
