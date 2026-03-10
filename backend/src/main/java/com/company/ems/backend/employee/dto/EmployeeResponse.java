package com.company.ems.backend.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String position;
    private Long positionId;
    private String department;
    private Long departmentId;
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
    private String nationalId;

    private String bankAccountNumber;
    private String bankName;
    private String bankBranch;

    private Long reportingManagerId;
    private String reportingManagerName;

    private String contractType;
    private LocalDate probationEndDate;
    private LocalDate contractEndDate;
    private String workLocation;

    private String nationality;
    private String bloodGroup;
    private String gender;

    private Integer annualLeaveBalance;
    private Integer sickLeaveBalance;

    private String avatarUrl;
    private String employeeCode;
    private LocalDate terminationDate;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
