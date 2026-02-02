package com.company.ems.backend.leave.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "Leave type is required")
    @Column(nullable = false, length = 50)
    private String leaveType; // ANNUAL, SICK, PERSONAL, UNPAID, EMERGENCY

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

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

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

    /**
     * Calculate total days between start and end date
     */
    public void calculateTotalDays() {
        if (startDate != null && endDate != null) {
            long days = ChronoUnit.DAYS.between(startDate, endDate) + 1; // +1 to include both start and end date
            
            if (isHalfDay != null && isHalfDay) {
                this.totalDays = 1; // Half day is counted as 0.5 but stored as 1
            } else {
                this.totalDays = (int) days;
            }
        }
    }

    /**
     * Approve the leave request
     */
    public void approve(User approver, String notes) {
        this.status = "APPROVED";
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.approvalNotes = notes;
    }

    /**
     * Reject the leave request
     */
    public void reject(User approver, String reason) {
        this.status = "REJECTED";
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.rejectionReason = reason;
    }

    /**
     * Cancel the leave request
     */
    public void cancel() {
        if ("PENDING".equals(this.status) || "APPROVED".equals(this.status)) {
            this.status = "CANCELLED";
        } else {
            throw new IllegalStateException("Cannot cancel a " + this.status + " leave request");
        }
    }

    /**
     * Check if leave is approved
     */
    public boolean isApproved() {
        return "APPROVED".equals(status);
    }

    /**
     * Check if leave is pending
     */
    public boolean isPending() {
        return "PENDING".equals(status);
    }

    /**
     * Check if leave is active (currently on leave)
     */
    public boolean isActive() {
        if (!"APPROVED".equals(status)) {
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
        
        // Validate date range
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
    }
}
