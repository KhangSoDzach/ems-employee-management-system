package com.company.ems.backend.payroll.dto;

import java.math.BigDecimal;

import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class SalaryComponentRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @NotNull(message = "Type is required")
    private SalaryComponentType type;

    @NotNull(message = "Taxable flag is required")
    private Boolean isTaxable;

    @NotNull(message = "Insurable flag is required")
    private Boolean isInsurable;

    @DecimalMin(value = "0.0", inclusive = true, message = "Amount must be greater than or equal to 0")
    private BigDecimal amount;

    @NotNull(message = "Status is required")
    private SalaryComponentStatus status;
}
