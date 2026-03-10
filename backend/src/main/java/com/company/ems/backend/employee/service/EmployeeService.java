package com.company.ems.backend.employee.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;

public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeRequest request);

    /** Trả hồ sơ (read-only, public fields) của chính user đang đăng nhập */
    PublicEmployeeResponse getMyProfile();

    PageResponse<EmployeeResponse> getAllEmployees(
            int page,
            int size,
            String department,
            String position,
            String status,
            String search);

    EmployeeResponse getEmployeeById(Long id);

    EmployeeResponse updateEmployee(Long id, EmployeeRequest request);

    void deleteEmployee(Long id);
}
