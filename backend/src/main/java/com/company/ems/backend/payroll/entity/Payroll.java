package com.company.ems.backend.payroll.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.payroll.enums.PayrollStatus;
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
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payroll entity for monthly payroll processing
 * Tracks salary payments, bonuses, deductions, and tax calculations
 */
@Entity
@Table(name = "payrolls", indexes = {
        @Index(name = "idx_payroll_employee", columnList = "employee_id"),
        @Index(name = "idx_payroll_period", columnList = "payrollMonth, payrollYear"),
        @Index(name = "idx_payroll_status", columnList = "status"),
        @Index(name = "idx_payroll_employee_period", columnList = "employee_id, payrollMonth, payrollYear", unique = true),})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payroll extends BaseEntity {

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Payroll month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    @Column(nullable = false)
    private Integer payrollMonth;

    @NotNull(message = "Payroll year is required")
    @Min(value = 2000, message = "Year must be 2000 or later")
    @Column(nullable = false)
    private Integer payrollYear;

    @NotNull(message = "Basic salary is required")
    @PositiveOrZero(message = "Basic salary must be zero or positive")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @PositiveOrZero(message = "Overtime pay must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal overtimePay = BigDecimal.ZERO;

    @PositiveOrZero(message = "Bonus must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @PositiveOrZero(message = "Allowances must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal allowances = BigDecimal.ZERO;

    @PositiveOrZero(message = "Tax deduction must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxDeduction = BigDecimal.ZERO;

    @PositiveOrZero(message = "Insurance deduction must be zero or positive")
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal insuranceDeduction = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal netPay;

    @Column
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private PayrollStatus status = PayrollStatus.DRAFT;

    @Size(max = 100, message = "Payment reference must not exceed 100 characters")
    @Column(length = 100)
    private String paymentReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_user_id")
    private User processedBy;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Column(length = 1000)
    private String notes;

    /**
     * Calculate net pay
     */
    public void calculateNetPay() {
        BigDecimal totalEarnings = basicSalary
                .add(overtimePay != null ? overtimePay : BigDecimal.ZERO)
                .add(bonus != null ? bonus : BigDecimal.ZERO)
                .add(allowances != null ? allowances : BigDecimal.ZERO);

        BigDecimal totalDeductions = (taxDeduction != null ? taxDeduction : BigDecimal.ZERO)
                .add(insuranceDeduction != null ? insuranceDeduction : BigDecimal.ZERO);

        this.netPay = totalEarnings.subtract(totalDeductions);
    }

    /**
     * Get total earnings before deductions
     */
    public BigDecimal getGrossPay() {
        return basicSalary
                .add(overtimePay != null ? overtimePay : BigDecimal.ZERO)
                .add(bonus != null ? bonus : BigDecimal.ZERO)
                .add(allowances != null ? allowances : BigDecimal.ZERO);
    }

    /**
     * Get total deductions
     */
    public BigDecimal getTotalDeductions() {
        return (taxDeduction != null ? taxDeduction : BigDecimal.ZERO)
                .add(insuranceDeduction != null ? insuranceDeduction : BigDecimal.ZERO);
    }

    /**
     * Process payroll
     */
    public void process(User processor) {
        this.status = PayrollStatus.PROCESSED;
        this.processedBy = processor;
        calculateNetPay();
    }

    /**
     * Mark payroll as paid
     */
    public void markAsPaid(String paymentRef) {
        if (this.status != PayrollStatus.PROCESSED) {
            throw new IllegalStateException("Can only mark processed payroll as paid");
        }
        this.status = PayrollStatus.PAID;
        this.paymentReference = paymentRef;
        this.paymentDate = LocalDate.now();
    }

    /**
     * Cancel payroll
     */
    public void cancel() {
        if (this.status == PayrollStatus.PAID) {
            throw new IllegalStateException("Cannot cancel paid payroll");
        }
        this.status = PayrollStatus.CANCELLED;
    }

    /**
     * Check if payroll is editable
     */
    public boolean isEditable() {
        return this.status == PayrollStatus.DRAFT;
    }
    
    @PrePersist
    @PreUpdate
    @SuppressWarnings("unused")
    private void beforeSave() {
        calculateNetPay();
    }
}
