package com.company.ems.backend.employee.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Override
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());
        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .build();
        return mapToResponse(employeeRepository.save(employee));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getAllEmployees(int page, int size, String department, String position, String status, String search) {
        CustomUserPrincipal principal = getCurrentPrincipal();
        PageRequest pageable = PageRequest.of(page, size);
        Page<Employee> employees;

        if (principal.hasDataScope(DataScope.ALL)) {
            employees = employeeRepository.searchEmployees(search, null, null, status, pageable);

        } else if (principal.hasDataScope(DataScope.TEAM)) {
            // Manager: chỉ trả về team của mình — lấy qua reportingManager
            employees = employeeRepository.searchEmployees(search, null, null, status, pageable);
            // TODO: thêm filter theo reportingManager khi có query hỗ trợ

        } else {
            // SELF: chỉ trả về chính mình
            Employee self = employeeRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee record không tồn tại cho userId: " + principal.getUserId()));
            return PageResponse.<EmployeeResponse>builder()
                    .content(List.of(mapToResponse(self)))
                    .page(0).size(1).totalElements(1L).totalPages(1)
                    .build();
        }

        return toPageResponse(employees, page, size);
    }


    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return mapToResponse(employee);
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        log.info("Updated employee [{}]", id);
        return mapToResponse(employeeRepository.save(employee));
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        employeeRepository.delete(employee);
        log.info("Deleted employee [{}]", id);
    }


    private CustomUserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserPrincipal) auth.getPrincipal();
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

    private PageResponse<EmployeeResponse> toPageResponse(Page<Employee> page, int pageNum, int size) {
        return PageResponse.<EmployeeResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(pageNum).size(size)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}