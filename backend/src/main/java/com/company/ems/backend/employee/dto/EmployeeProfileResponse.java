package com.company.ems.backend.employee.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class EmployeeProfileResponse {
    Long      id;
    String    employeeCode;
    String    fullName;
    String    email;
    String    phone;
    String    departmentName;
    String    positionTitle;
    LocalDate hireDate;
    String    status;
    String    avatarUrl;
    String    workLocation;
}