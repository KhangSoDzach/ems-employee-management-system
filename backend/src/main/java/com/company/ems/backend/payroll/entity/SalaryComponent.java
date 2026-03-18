package com.company.ems.backend.payroll.entity;

import java.math.BigDecimal;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "salary_components", indexes = {
        @Index(name = "idx_salary_components_status", columnList = "status"),
        @Index(name = "idx_salary_components_type", columnList = "type"),
        @Index(name = "idx_salary_components_is_deleted", columnList = "is_deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryComponent extends BaseEntity {

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(nullable = false, length = 255, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SalaryComponentType type;

    @Column(name = "is_taxable", nullable = false)
    private Boolean isTaxable;

    @Column(name = "is_insurable", nullable = false)
    private Boolean isInsurable;

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "rate_percent", precision = 7, scale = 4)
    private BigDecimal ratePercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SalaryComponentNature nature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SalaryComponentStatus status;
}
