package com.company.ems.backend.payroll.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryComponentResponse {
    private Long id;
    private String code;
    private String name;
    private SalaryComponentType type;
    private Boolean isTaxable;
    private Boolean isInsurable;
    private BigDecimal amount;
    private SalaryComponentStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
