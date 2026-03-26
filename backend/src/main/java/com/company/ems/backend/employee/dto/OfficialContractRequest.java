package com.company.ems.backend.employee.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficialContractRequest {

    @NotNull(message = "Contract start date is required")
    private LocalDate contractStartDate;

    @NotBlank(message = "Contract term is required")
    private String contractTerm;

    @NotNull(message = "Official salary is required")
    @Positive(message = "Official salary must be greater than 0")
    private Double officialSalary;
}
