package com.company.ems.backend.payroll.entity;

import com.company.ems.backend.payroll.domain.valueobject.Money;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot of one salary component line within a {@link Payroll} record.
 *
 * <p>Stores the component's code, name, type and rate <em>at the time of
 * calculation</em>, so a subsequent policy change does not alter historical
 * payroll data (immutable audit trail).
 *
 * <p>This entity intentionally does NOT extend {@code BaseEntity} — it has no
 * soft-delete semantics and needs a minimal, append-only structure.
 */
@Entity
@Table(
    name = "payroll_items",
    indexes = {
        @Index(name = "idx_payroll_items_payroll_id", columnList = "payroll_id"),
        @Index(name = "idx_payroll_items_type",       columnList = "component_type")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Payroll payroll;
    @Column(name = "component_code", nullable = false, length = 50)
    private String componentCode;

    @Column(name = "component_name", nullable = false, length = 255)
    private String componentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false, length = 30)
    private SalaryComponentType componentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SalaryComponentNature nature;
    @Column(name = "rate_percent", precision = 7, scale = 4)
    private BigDecimal ratePercent;
    @Column(name = "computed_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal computedAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
    public static PayrollItem forInsurance(
            Payroll payroll, String code, String name, Money amount) {
        return PayrollItem.builder()
                .payroll(payroll)
                .componentCode(code)
                .componentName(name)
                .componentType(SalaryComponentType.INSURANCE)
                .nature(SalaryComponentNature.DEDUCTION)
                .computedAmount(amount.amount())
                .build();
    }

    public static PayrollItem forPit(Payroll payroll, Money pitAmount) {
        return PayrollItem.builder()
                .payroll(payroll)
                .componentCode("PIT")
                .componentName("Thuế thu nhập cá nhân")
                .componentType(SalaryComponentType.DEDUCTION)
                .nature(SalaryComponentNature.DEDUCTION)
                .computedAmount(pitAmount.amount())
                .build();
    }

    public static PayrollItem forComponent(
            Payroll payroll,
            SalaryComponent component,
            Money computedAmount) {
        return PayrollItem.builder()
                .payroll(payroll)
                .componentCode(component.getCode())
                .componentName(component.getName())
                .componentType(component.getType())
                .nature(component.getNature())
                .ratePercent(component.getRatePercent())
                .computedAmount(computedAmount.amount())
                .build();
    }
}
