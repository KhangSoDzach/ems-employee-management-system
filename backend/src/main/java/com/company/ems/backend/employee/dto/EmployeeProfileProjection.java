package com.company.ems.backend.employee.dto;

import java.time.LocalDate;

public interface EmployeeProfileProjection {
    Long      getId();
    String    getEmployeeCode();
    String    getFirstName();
    String    getLastName();
    String    getEmail();
    String    getPhone();
    String    getDepartmentName();
    String    getPositionTitle();
    LocalDate getHireDate();
    String    getStatus();
    String    getAvatarUrl();
    String    getWorkLocation();
}