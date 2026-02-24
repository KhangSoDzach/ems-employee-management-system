package com.company.ems.backend.employee.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DataScopeService dataScopeService;

    @Override
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        // TODO: Implement full mapping logic
        log.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());

        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .build();

        Employee saved = employeeRepository.save(employee);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getAllEmployees(int page, int size, String department,
                                                          String position, String status, String search) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        PageRequest pageable = PageRequest.of(page, size);

        Page<Employee> employees;

        if (principal.hasDataScope(DataScope.ALL)) {
            // HR Admin: xem tất cả với filter
            employees = employeeRepository.searchEmployees(search, null, null, status, pageable);

        } else if (principal.hasDataScope(DataScope.TEAM)) {
            // Manager: chỉ xem team của mình
            // Lấy employee record của manager để tìm subordinates
            Employee managerEmployee = employeeRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee record không tồn tại cho userId: " + principal.getUserId()));
            // TODO: Implement findByReportingManager query
            employees = employeeRepository.searchEmployees(search, null, null, status, pageable);

        } else {
            // Employee (SELF): chỉ thấy chính mình
            Employee self = employeeRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee record không tồn tại cho userId: " + principal.getUserId()));
            // Wrap single result as page
            return PageResponse.<EmployeeResponse>builder()
                    .content(List.of(mapToResponse(self)))
                    .page(0).size(1).totalElements(1L).totalPages(1)
                    .build();
        }

        List<EmployeeResponse> content = employees.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<EmployeeResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(employees.getTotalElements())
                .totalPages(employees.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        // DataScope check: ném ForbiddenException nếu không có quyền
        dataScopeService.assertCanAccessEmployee(principal, id);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        log.debug("User [{}] accessed employee [{}] - DataScopes: {}",
                principal.getUsername(), id, principal.getDataScopes());

        return mapToResponse(employee);
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        // DataScope check
        dataScopeService.assertCanAccessEmployee(principal, id);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        // TODO: Map request fields → entity
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        // ... map các fields khác

        Employee updated = employeeRepository.save(employee);
        log.info("User [{}] updated employee [{}]", principal.getUsername(), id);

        return mapToResponse(updated);
    }

    @Override
    public void deleteEmployee(Long id) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        // Chỉ ALL scope mới được xóa - extra safety check
        if (!principal.hasDataScope(DataScope.ALL)) {
            throw new ForbiddenException();
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        employeeRepository.delete(employee);
        log.info("User [{}] deleted employee [{}]", principal.getUsername(), id);
    }

    @Override
    public PageResponse<EmployeeResponse> getAllEmplyees(int page, int size, String department, String position, String status, String search) {
        return null;
    }


    private EmployeeResponse mapToResponse(Employee employee) {
        if (employee == null) return null;
        return EmployeeResponse.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .status(employee.getStatus() != null ? employee.getStatus().name() : null)
                .build();
    }
}