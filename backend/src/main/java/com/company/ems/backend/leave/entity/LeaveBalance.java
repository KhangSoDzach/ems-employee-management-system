package com.company.ems.backend.leave.entity;

import java.time.LocalDate;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.leave.enums.LeaveType;

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
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Leave Balance entity for tracking employee leave quotas and usage
 * Manages annual leave allocation, accrual, and carry-forward rules
 */
@Entity
@Table(name = "leave_balances", indexes = {
        @Index(name = "idx_leave_balance_employee", columnList = "employee_id"),
        @Index(name = "idx_leave_balance_year", columnList = "year"),
        @Index(name = "idx_leave_balance_employee_year_type", columnList = "employee_id, year, leaveType", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalance extends BaseEntity {

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Year is required")
    @Min(value = 2000, message = "Year must be 2000 or later")
    @Column(nullable = false)
    private Integer year;

    @NotNull(message = "Leave type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LeaveType leaveType;

    @NotNull(message = "Total days is required")
    @Min(value = 0, message = "Total days must be zero or positive")
    @Column(nullable = false)
    @Builder.Default
    private Integer totalDays = 0;

    @Min(value = 0, message = "Used days must be zero or positive")
    @Column(nullable = false)
    @Builder.Default
    private Integer usedDays = 0;

    @Column(nullable = false)
    private Integer remainingDays;

    @Min(value = 0, message = "Carried forward days must be zero or positive")
    @Column(nullable = false)
    @Builder.Default
    private Integer carriedForwardDays = 0;

    @Column
    private LocalDate expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean allowCarryForward = true;

    @Min(value = 0, message = "Max carry forward must be zero or positive")
    @Column
    private Integer maxCarryForward;

    @Column(length = 500)
    private String notes;

    /**
     * Calculate remaining days
     */
    public void calculateRemainingDays() {
        this.remainingDays = (totalDays != null ? totalDays : 0) - (usedDays != null ? usedDays : 0);
    }

    /**
     * Use leave days
     */
    public void useLeave(int days) {
        if (days < 0) {
            throw new IllegalArgumentException("Days must be positive");
        }
        if (days > remainingDays) {
            throw new IllegalStateException(
                    String.format("Insufficient leave balance. Requested: %d, Available: %d", days, remainingDays));
        }
        this.usedDays += days;
        calculateRemainingDays();
    }

    /**
     * Return leave days (when leave is cancelled)
     */
    public void returnLeave(int days) {
        if (days < 0) {
            throw new IllegalArgumentException("Days must be positive");
        }
        this.usedDays = Math.max(0, this.usedDays - days);
        calculateRemainingDays();
    }

    /**
     * Add leave quota (for adjustments or bonuses)
     */
    public void addQuota(int days) {
        if (days < 0) {
            throw new IllegalArgumentException("Days must be positive");
        }
        this.totalDays += days;
        calculateRemainingDays();
    }

    /**
     * Check if balance has expired
     */
    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(expiryDate);
    }

    /**
     * Check if employee has sufficient balance
     */
    public boolean hasSufficientBalance(int days) {
        return remainingDays >= days;
    }

    /**
     * Get carry forward eligible days
     */
    public int getCarryForwardEligibleDays() {
        if (!allowCarryForward) {
            return 0;
        }

        int eligible = remainingDays;

        if (maxCarryForward != null && eligible > maxCarryForward) {
            eligible = maxCarryForward;
        }

        return eligible;
    }

    /**
     * Reset for new year with carry forward
     */
    public void resetForNewYear(int newYearQuota) {
        int carryForward = getCarryForwardEligibleDays();

        this.year += 1;
        this.totalDays = newYearQuota + carryForward;
        this.carriedForwardDays = carryForward;
        this.usedDays = 0;
        calculateRemainingDays();
    }

    @PrePersist
    @PreUpdate
    private void beforeSave() {
        calculateRemainingDays();

        // Set default expiry to end of year if not set
        if (expiryDate == null && year != null) {
            expiryDate = LocalDate.of(year, 12, 31);
        }
    }
}
