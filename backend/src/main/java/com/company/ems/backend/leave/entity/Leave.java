package com.company.ems.backend.leave.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Leave entity for managing employee leave requests
 * Tracks leave applications, approvals, and status
 */
@Entity
@Table(name = "leaves", indexes = {
        @Index(name = "idx_leave_employee", columnList = "employee_id"),
        @Index(name = "idx_leave_status", columnList = "status"),
        @Index(name = "idx_leave_type", columnList = "leaveType"),
        @Index(name = "idx_leave_dates", columnList = "startDate, endDate")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Leave extends BaseEntity {

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Leave type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LeaveType leaveType;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer totalDays;

    @NotBlank(message = "Reason is required")
    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(length = 40, nullable = false)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING_LEVEL_1;

    // ─── Multi-level approval fields ─────────────────────────────────────────

    /** Current level the request is waiting at (1-based). */
    @Column(nullable = false)
    @Builder.Default
    private Integer currentApprovalLevel = 1;

    /** Total levels required for this request (determined at submission time). */
    @Column(nullable = false)
    @Builder.Default
    private Integer maxApprovalLevel = 1;

    /** FK to the workflow_templates row used when this request was created. */
    @Column(name = "workflow_template_id")
    private Long workflowTemplateId;

    /**
     * True when the long-leave rule fired and an extra ROLE_HR level was
     * auto-added beyond the template's configured levels.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean longLeaveHrRequired = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column
    private LocalDateTime approvedAt;

    @Column(length = 500)
    private String approvalNotes;

    @Column(length = 500)
    private String rejectionReason;

    @Column
    @Builder.Default
    private Boolean isHalfDay = false;

    @Column(length = 500)
    private String attachmentUrl; // For sick leave medical certificates, etc.

    @Column
    @Builder.Default
    private Boolean isEmergency = false;

    // New fields for enhanced leave management
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegated_to_employee_id")
    private Employee delegatedTo;

    @Column
    private Integer leaveBalanceBefore;

    @Column
    private Integer leaveBalanceAfter;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPaid = true;

    @Size(max = 100, message = "Emergency contact during leave must not exceed 100 characters")
    @Column(length = 100)
    private String emergencyContactDuringLeave;

    @Size(max = 20, message = "Emergency phone during leave must not exceed 20 characters")
    @Column(length = 20)
    private String emergencyPhoneDuringLeave;

    /**
     * Calculate total working days between start and end date (inclusive, excluding weekends)
     */
    public static int calculateDays(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return 0;
        }
        if (endDate.isBefore(startDate)) {
            return 0;
        }
        int workingDays = 0;
        java.time.LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            java.time.DayOfWeek dow = current.getDayOfWeek();
            if (dow != java.time.DayOfWeek.SATURDAY && dow != java.time.DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    /**
     * Calculate total days between start and end date (excluding weekends)
     */
    public void calculateTotalDays() {
        if (startDate != null && endDate != null) {
            int workingDays = calculateDays(startDate, endDate);

            if (isHalfDay != null && isHalfDay && workingDays > 0) {
                this.totalDays = 1; // Half day is counted as 1 day in your current logic but represents 0.5 effectively.
                                    // Keeping it 1 to stay consistent with your previous implementation.
            } else {
                this.totalDays = workingDays;
            }
        }
    }

    /**
     * Approve the leave request
     */
    public void approve(User approver, String notes) {
        this.status = LeaveStatus.APPROVED;
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalNotes = notes;
    }

    /**
     * Reject the leave request
     */
    public void reject(User approver, String reason) {
        this.status = LeaveStatus.REJECTED;
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.rejectionReason = reason;
    }

    /**
     * Cancel the leave request.
     * Allowed from any pending state or from APPROVED.
     */
    public void cancel() {
        if (status != null && (status.isPending() || LeaveStatus.APPROVED.equals(status))) {
            this.status = LeaveStatus.CANCELLED;
        } else {
            throw new IllegalStateException("Cannot cancel a " + this.status + " leave request");
        }
    }

    /**
     * Advance the request to the next approval level.
     * Should only be called when currentApprovalLevel &lt; maxApprovalLevel.
     */
    public void advanceToNextLevel() {
        if (currentApprovalLevel == null || maxApprovalLevel == null) {
            throw new IllegalStateException("Approval level fields are not initialised");
        }
        if (currentApprovalLevel >= maxApprovalLevel) {
            throw new IllegalStateException(
                    "Cannot advance: already at max level " + maxApprovalLevel);
        }
        this.currentApprovalLevel++;
        this.status = LeaveStatus.pendingForLevel(this.currentApprovalLevel);
    }

    /**
     * Returns {@code true} if the request is waiting at the given 1-based level.
     */
    public boolean isPendingAtLevel(int level) {
        return currentApprovalLevel != null
                && currentApprovalLevel == level
                && status != null
                && status.isPending();
    }

    /**
     * Withdraw the leave request (by employee). Only allowed on PENDING_LEVEL_1 /
     * legacy PENDING.
     */
    @SuppressWarnings("deprecation")
    public void withdraw() {
        if (LeaveStatus.PENDING_LEVEL_1.equals(this.status)
                || LeaveStatus.PENDING.equals(this.status)) {
            this.status = LeaveStatus.WITHDRAWN;
        } else {
            throw new IllegalStateException("Can only withdraw pending leave requests");
        }
    }

    /**
     * Check if leave is approved
     */
    public boolean isApproved() {
        return LeaveStatus.APPROVED.equals(status);
    }

    /**
     * Check if leave has any pending status (any level).
     */
    public boolean isPending() {
        return status != null && status.isPending();
    }

    /**
     * Check if leave is active (currently on leave)
     */
    public boolean isActive() {
        if (!LeaveStatus.APPROVED.equals(status)) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    /**
     * Get actual days count (0.5 for half day)
     */
    public Double getActualDays() {
        if (totalDays == null) {
            return 0.0;
        }
        return isHalfDay != null && isHalfDay ? 0.5 : totalDays.doubleValue();
    }

    @PrePersist
    @PreUpdate
    private void beforeSave() {
        calculateTotalDays();

        // Validate date range - throw BusinessException so controller returns a clear business error
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("INVALID_DATE_RANGE", "End date cannot be before start date");
        }
    }
}
