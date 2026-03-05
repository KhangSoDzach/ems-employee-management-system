package com.company.ems.backend.attendance.entity;

import com.company.ems.backend.attendance.enums.AdjustmentReason;
import com.company.ems.backend.attendance.enums.AdjustmentRequestStatus;
import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents an employee's request to manually correct an attendance record.
 *
 * <p>The request goes through a multi-level approval workflow configured by an Admin
 * via {@link com.company.ems.backend.workflow.entity.WorkflowTemplate}.
 *
 * <p>All state transitions are recorded in
 * {@link AttendanceAdjustmentHistory} for a full audit trail.
 */
@Entity
@Table(name = "attendance_adjustment_requests", indexes = {
        @Index(name = "idx_adj_req_employee",     columnList = "employee_id"),
        @Index(name = "idx_adj_req_attendance",   columnList = "attendance_id"),
        @Index(name = "idx_adj_req_status",       columnList = "status"),
        @Index(name = "idx_adj_req_date",         columnList = "request_date"),
        @Index(name = "idx_adj_req_level_status", columnList = "current_approval_level, status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAdjustmentRequest extends BaseEntity {

    // ─── Core relations ───────────────────────────────────────────────────────

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /**
     * The attendance record being corrected. May be {@code null} when the employee
     * is requesting a completely new check-in record that doesn't exist yet.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id")
    private Attendance attendance;

    // ─── Requested correction values ──────────────────────────────────────────

    @NotNull(message = "Request date is required")
    @Column(nullable = false)
    private LocalDate requestDate;

    /** Proposed corrected check-in time (null = not changing check-in). */
    @Column
    private LocalDateTime proposedCheckInTime;

    /** Proposed corrected check-out time (null = not changing check-out). */
    @Column
    private LocalDateTime proposedCheckOutTime;

    // ─── Reason ───────────────────────────────────────────────────────────────

    @NotNull(message = "Reason type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AdjustmentReason reasonType;

    @NotBlank(message = "Reason text is required")
    @Size(min = 10, max = 2000, message = "Reason must be between 10 and 2000 characters")
    @Column(nullable = false, length = 2000)
    private String reasonText;

    // ─── Workflow state ───────────────────────────────────────────────────────

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private AdjustmentRequestStatus status = AdjustmentRequestStatus.PENDING_LEVEL_1;

    /** Current approval level (1-based). Starts at 1 after initial submit. */
    @Column(nullable = false)
    @Builder.Default
    private int currentApprovalLevel = 1;

    /** Total number of approval levels required (loaded from the active WorkflowTemplate). */
    @Column(nullable = false)
    @Builder.Default
    private int maxApprovalLevel = 1;

    /** ID of the WorkflowTemplate used for this request (for traceability). */
    @Column
    private Long workflowTemplateId;

    // ─── Incident metadata (system-collected at the time of the original issue) ─

    @Column(length = 50)
    private String incidentIpAddress;

    @Column(length = 255)
    private String incidentDeviceInfo;

    @Column(length = 500)
    private String incidentUserAgent;

    /**
     * Last known geolocation log at incident time, stored as a JSON string.
     * Example: {@code {"lat": 10.762, "lon": 106.660, "accuracy": 25.0, "timestamp": "..."}}
     */
    @Column(columnDefinition = "TEXT")
    private String incidentGeoLog;

    /**
     * Photo captured at incident time (if any), stored as a relative filesystem path.
     */
    @Column(length = 500)
    private String incidentPhotoUrl;

    // ─── Manual review flag ───────────────────────────────────────────────────

    /**
     * {@code true} when geolocation or photo metadata is missing / suspicious,
     * prompting the approver to apply extra scrutiny.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean requiresManualReview = false;

    // ─── Final resolution ─────────────────────────────────────────────────────

    @Column
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedBy;

    // ─── Convenience helpers ──────────────────────────────────────────────────

    /**
     * Returns {@code true} if the request is in any PENDING_LEVEL_N state.
     */
    public boolean isPending() {
        return status != null && status.isPending();
    }

    /**
     * Advances the status to the next approval level.
     * If the current level equals {@code maxApprovalLevel}, transitions to APPROVED
     * and records the resolution timestamp.
     *
     * @param resolvedByUser the user who performed the final approval
     */
    public void advanceApproval(User resolvedByUser) {
        if (currentApprovalLevel >= maxApprovalLevel) {
            this.status      = AdjustmentRequestStatus.APPROVED;
            this.resolvedAt  = LocalDateTime.now();
            this.resolvedBy  = resolvedByUser;
        } else {
            this.currentApprovalLevel++;
            this.status = AdjustmentRequestStatus.pendingForLevel(currentApprovalLevel);
        }
    }

    /**
     * Transitions to REJECTED and records resolution info.
     */
    public void reject(User rejectedByUser) {
        this.status     = AdjustmentRequestStatus.REJECTED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = rejectedByUser;
    }

    /**
     * Returns the request to the employee for correction.
     * Resets the approval level to 1 (will be applied again on RESUBMIT).
     */
    public void returnToEmployee() {
        this.status = AdjustmentRequestStatus.RETURNED_TO_EMPLOYEE;
    }

    /**
     * Resubmits the request after it was RETURNED_TO_EMPLOYEE.
     * Resets the status to PENDING_LEVEL_1 and the level counter to 1.
     */
    public void resubmit() {
        this.status               = AdjustmentRequestStatus.PENDING_LEVEL_1;
        this.currentApprovalLevel = 1;
        this.resolvedAt           = null;
        this.resolvedBy           = null;
    }
}
