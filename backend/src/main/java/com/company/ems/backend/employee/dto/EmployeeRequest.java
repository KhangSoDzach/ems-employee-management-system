package com.company.ems.backend.employee.dto;

import com.company.ems.backend.employee.enums.ContractType;
import com.company.ems.backend.employee.enums.Gender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import com.company.ems.backend.common.validation.ValidAge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {
    @NotBlank(message = "REQUIRED_FIELD|First name is required|e.g. John")
    private String firstName;

    @NotBlank(message = "REQUIRED_FIELD|Last name is required|e.g. Doe")
    private String lastName;

    @NotBlank(message = "REQUIRED_FIELD|Email is required|e.g. user@company.com")
    @Email(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "INVALID_FORMAT|Email format is invalid|e.g. user@company.com")
    private String email;

    @Pattern(regexp = "^$|^(\\+84[0-9]{9,10}|0[0-9]{9,10})$", message = "INVALID_FORMAT|Phone format is invalid (Vietnam format required)|e.g. +84912345678 or 0912345678")
    private String phone;

    @NotNull(message = "REQUIRED_FIELD|Date of birth is required|YYYY-MM-DD")
    @ValidAge(min = 18, max = 70)
    private LocalDate dateOfBirth;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    @NotNull(message = "Position is required")
    private Long positionId;

    @NotNull(message = "Department is required")
    private Long departmentId;

    @NotNull(message = "Salary is required")
    private Double salary;

    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;

    private String taxId;
    private String socialSecurityNumber;

    @Pattern(regexp = "^$|^([0-9]{9}|[0-9]{12})$", message = "INVALID_FORMAT|National ID must be 9 or 12 digits|e.g. 001234567890")
    private String nationalId;

    private String bankAccountNumber;
    private String bankName;
    private String bankBranch;

    private Long reportingManagerId;
    private ContractType contractType;
    private LocalDate probationEndDate;
    private LocalDate contractEndDate;
    private String workLocation;

    private String nationality;
    private String bloodGroup;
    private Gender gender;
    private String avatarUrl;
    private String notes;
}
