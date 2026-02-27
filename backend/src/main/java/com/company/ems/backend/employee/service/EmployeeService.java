package com.company.ems.backend.employee.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;

public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeRequest request);
    PageResponse<EmployeeResponse> getAllEmployees(
            int page,
            int size,
            String department,
            String position,
            String status,
            String search
    );
    EmployeeResponse getEmployeeById(Long id);
    EmployeeResponse updateEmployee(Long id, EmployeeRequest request);
    void deleteEmployee(Long id);

    PageResponse<EmployeeResponse> getAllEmplyees(int page, int size, String department, String position, String status, String search);
}
