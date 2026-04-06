package com.company.ems.backend.employee.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicEmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String employeeCode;
    private String nationalId;
    private String position;
    private String department;
    private String address;
    private String city;
    private String state;
    private String country;
    private String status;
    @Schema(description = "Remaining annual leave days")
    private Integer annualLeaveBalance;

    @Schema(description = "Remaining sick leave days")
    private Integer sickLeaveBalance;

    @Schema(description = "Attendance percentage for current month")
    private Double attendancePercentage;

    private String avatarUrl;
    private Long reportingManagerId;
    private String reportingManagerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
