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
    private String department;
    private Double salary;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
