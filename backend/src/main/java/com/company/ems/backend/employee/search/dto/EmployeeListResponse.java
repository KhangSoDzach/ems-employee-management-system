package com.company.ems.backend.employee.search.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class EmployeeListResponse {
    Long      id;
    String    employeeCode;
    String    fullName;
    String    email;
    String    phone;
    String    departmentName;
    String    positionTitle;
    String    workLocation;
    LocalDate hireDate;
    String    status;
    String    avatarUrl;
}