package com.company.ems.backend.salary.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Salary entity for tracking employee salary history and adjustments
 * Maintains record of all salary changes with effective dates
 */
@Entity
@Table(name = "salaries", indexes = {
        @Index(name = "idx_salary_employee", columnList = "employee_id"),
        @Index(name = "idx_salary_effective_dates", columnList = "effectiveFrom, effectiveTo"),
        @Index(name = "idx_salary_employee_effective", columnList = "employee_id, effectiveFrom, effectiveTo")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Salary extends BaseEntity {

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Basic salary is required")
    @PositiveOrZero(message = "Basic salary must be zero or positive")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @PositiveOrZero(message = "Allowances must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowances = BigDecimal.ZERO;

    @PositiveOrZero(message = "Deductions must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal netSalary;

    @NotNull(message = "Effective from date is required")
    @Column(nullable = false)
    private LocalDate effectiveFrom;

    @Column
    private LocalDate effectiveTo;

    @Size(max = 500, message = "Change reason must not exceed 500 characters")
    @Column(length = 500)
    private String changeReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column
    private LocalDate approvedAt;

    @Size(max = 3, message = "Currency must not exceed 3 characters")
    @Column(length = 3, nullable = false)
    @Builder.Default
    private String currency = "VND";

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Column(length = 1000)
    private String notes;

    /**
     * Calculate net salary
     */
    public void calculateNetSalary() {
        BigDecimal totalAllowances = allowances != null ? allowances : BigDecimal.ZERO;
        BigDecimal totalDeductions = deductions != null ? deductions : BigDecimal.ZERO;

        this.netSalary = basicSalary
                .add(totalAllowances)
                .subtract(totalDeductions);
    }

    /**
     * Check if this salary is currently active
     */
    public boolean isActive() {
        LocalDate today = LocalDate.now();
        if (effectiveFrom == null) {
            return false;
        }

        boolean afterStart = !today.isBefore(effectiveFrom);
        boolean beforeEnd = effectiveTo == null || !today.isAfter(effectiveTo);

        return afterStart && beforeEnd;
    }

    /**
     * End this salary record
     */
    public void end(LocalDate endDate) {
        this.effectiveTo = endDate;
    }

    /**
     * Approve salary change
     */
    public void approve(User approver) {
        this.approvedBy = approver;
        this.approvedAt = LocalDate.now();
    }

    @PrePersist
    @PreUpdate
    private void beforeSave() {
        calculateNetSalary();

        // Validate date range
        if (effectiveFrom != null && effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective to date cannot be before effective from date");
        }
    }
}
