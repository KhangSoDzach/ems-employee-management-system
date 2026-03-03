package com.company.ems.backend.employee.search.dto;
import java.time.LocalDate;

public interface EmployeeSearchProjection {
    Long      getId();
    String    getEmployeeCode();
    String    getFirstName();
    String    getLastName();
    String    getEmail();
    String    getPhone();
    String    getDepartmentName();
    String    getPositionTitle();
    String    getWorkLocation();
    LocalDate getHireDate();
    String    getStatus();
    String    getAvatarUrl();
}