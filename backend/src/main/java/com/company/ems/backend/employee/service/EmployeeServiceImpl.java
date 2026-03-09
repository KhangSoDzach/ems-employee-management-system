package com.company.ems.backend.employee.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.position.entity.Position;
import com.company.ems.backend.position.repository.PositionRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

        private final EmployeeRepository employeeRepository;
        private final DepartmentRepository departmentRepository;
        private final PositionRepository positionRepository;
        private final DataScopeService dataScopeService;

        @Override
        public EmployeeResponse createEmployee(EmployeeRequest request) {
                log.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());

                if (employeeRepository.existsByEmail(request.getEmail())) {
                        throw new BusinessException("DUPLICATE_EMAIL", "Email đã tồn tại trong hệ thống");
                }
                if (request.getNationalId() != null && employeeRepository.existsByNationalId(request.getNationalId())) {
                        throw new BusinessException("DUPLICATE_NATIONAL_ID", "CCCD/CMND đã tồn tại trong hệ thống");
                }

                Department department = departmentRepository.findById(request.getDepartmentId())
                                .orElseThrow(() -> new ResourceNotFoundException("Department", "id",
                                                request.getDepartmentId()));

                Position position = positionRepository.findById(request.getPositionId())
                                .orElseThrow(() -> new ResourceNotFoundException("Position", "id",
                                                request.getPositionId()));

                Employee reportingManager = null;
                if (request.getReportingManagerId() != null) {
                        reportingManager = employeeRepository.findById(request.getReportingManagerId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Employee (Manager)", "id",
                                                        request.getReportingManagerId()));
                }

                String year = String.valueOf(java.time.LocalDate.now().getYear());
                String prefix = department.getCode() + year;
                String maxCode = employeeRepository.findMaxEmployeeCodeByPrefix(prefix);
                int seq = 1;
                if (maxCode != null && maxCode.length() > prefix.length()) {
                        try {
                                seq = Integer.parseInt(maxCode.substring(prefix.length())) + 1;
                        } catch (NumberFormatException ignored) {
                        }
                }
                String employeeCode = String.format("%s%05d", prefix, seq);

                Employee employee = Employee.builder()
                                .employeeCode(employeeCode)
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .email(request.getEmail())
                                .phone(request.getPhone())
                                .dateOfBirth(request.getDateOfBirth())
                                .hireDate(request.getHireDate())
                                .department(department)
                                .position(position)
                                .address(request.getAddress())
                                .city(request.getCity())
                                .state(request.getState())
                                .zipCode(request.getZipCode())
                                .country(request.getCountry())

                                .emergencyContactName(request.getEmergencyContactName())
                                .emergencyContactPhone(request.getEmergencyContactPhone())
                                .emergencyContactRelation(request.getEmergencyContactRelation())

                                .taxId(request.getTaxId())
                                .socialSecurityNumber(request.getSocialSecurityNumber())
                                .nationalId(request.getNationalId())

                                .bankAccountNumber(request.getBankAccountNumber())
                                .bankName(request.getBankName())
                                .bankBranch(request.getBankBranch())

                                .reportingManager(reportingManager)
                                .contractType(request.getContractType())
                                .probationEndDate(request.getProbationEndDate())
                                .contractEndDate(request.getContractEndDate())
                                .workLocation(request.getWorkLocation())

                                .nationality(request.getNationality())
                                .bloodGroup(request.getBloodGroup())
                                .gender(request.getGender())
                                .avatarUrl(request.getAvatarUrl())
                                .notes(request.getNotes())
                                .status(EmployeeStatus.ACTIVE)
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

                Long departmentIdFilter = null;
                if (department != null && !department.isBlank()) {
                        try {
                                departmentIdFilter = Long.parseLong(department);
                        } catch (NumberFormatException ignored) {
                        }
                }

                Long positionIdFilter = null;
                if (position != null && !position.isBlank()) {
                        try {
                                positionIdFilter = Long.parseLong(position);
                        } catch (NumberFormatException ignored) {
                        }
                }

                Page<Employee> employees;

                if (principal.hasDataScope(DataScope.ALL)) {
                        // HR Admin: xem tất cả với filter
                        employees = employeeRepository.searchEmployees(search, departmentIdFilter, positionIdFilter,
                                        status, pageable);

                } else if (principal.hasDataScope(DataScope.TEAM)) {
                        // Manager: chỉ xem team của mình
                        Employee managerEmployee = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));

                        employees = employeeRepository.searchEmployeesByManager(managerEmployee.getId(), search,
                                        departmentIdFilter, positionIdFilter, status, pageable);

                } else {
                        // Employee (SELF): chỉ thấy chính mình
                        Employee self = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));
                        // Wrap single result as page
                        return PageResponse.<EmployeeResponse>builder()
                                        .content(List.of(mapToResponse(self)))
                                        .page(0).size(1).totalElements(1L).totalPages(1)
                                        .build();
                }

                List<EmployeeResponse> content = employees.getContent().stream()
                                .map(this::mapToResponse)
                                .toList();

                return PageResponse.<EmployeeResponse>builder().content(content).page(page).size(size)
                                .totalElements(employees.getTotalElements()).totalPages(employees.getTotalPages())
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

                if (!employee.getEmail().equals(request.getEmail())
                                && employeeRepository.existsByEmail(request.getEmail())) {
                        throw new BusinessException("DUPLICATE_EMAIL", "Email đã tồn tại trong hệ thống");
                }
                if (request.getNationalId() != null && !request.getNationalId().equals(employee.getNationalId())
                                && employeeRepository.existsByNationalId(request.getNationalId())) {
                        throw new BusinessException("DUPLICATE_NATIONAL_ID", "CCCD/CMND đã tồn tại trong hệ thống");
                }

                Department departmentModel = departmentRepository.findById(request.getDepartmentId())
                                .orElseThrow(() -> new ResourceNotFoundException("Department", "id",
                                                request.getDepartmentId()));

                Position positionModel = positionRepository.findById(request.getPositionId())
                                .orElseThrow(() -> new ResourceNotFoundException("Position", "id",
                                                request.getPositionId()));

                Employee reportingManager = null;
                if (request.getReportingManagerId() != null) {
                        reportingManager = employeeRepository.findById(request.getReportingManagerId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Employee (Manager)", "id",
                                                        request.getReportingManagerId()));
                }

                employee.setFirstName(request.getFirstName());
                employee.setLastName(request.getLastName());
                employee.setEmail(request.getEmail());
                employee.setPhone(request.getPhone());
                employee.setDateOfBirth(request.getDateOfBirth());
                employee.setHireDate(request.getHireDate());
                employee.setDepartment(departmentModel);
                employee.setPosition(positionModel);

                employee.setAddress(request.getAddress());
                employee.setCity(request.getCity());
                employee.setState(request.getState());
                employee.setZipCode(request.getZipCode());
                employee.setCountry(request.getCountry());

                employee.setEmergencyContactName(request.getEmergencyContactName());
                employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
                employee.setEmergencyContactRelation(request.getEmergencyContactRelation());

                employee.setTaxId(request.getTaxId());
                employee.setSocialSecurityNumber(request.getSocialSecurityNumber());
                employee.setNationalId(request.getNationalId());

                employee.setBankAccountNumber(request.getBankAccountNumber());
                employee.setBankName(request.getBankName());
                employee.setBankBranch(request.getBankBranch());

                employee.setReportingManager(reportingManager);
                employee.setContractType(request.getContractType());
                employee.setProbationEndDate(request.getProbationEndDate());
                employee.setContractEndDate(request.getContractEndDate());
                employee.setWorkLocation(request.getWorkLocation());

                employee.setNationality(request.getNationality());
                employee.setBloodGroup(request.getBloodGroup());
                employee.setGender(request.getGender());
                employee.setAvatarUrl(request.getAvatarUrl());
                employee.setNotes(request.getNotes());

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
        @Transactional(readOnly = true)
        public PublicEmployeeResponse getMyProfile() {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Employee employee = employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Không tìm thấy hồ sơ nhân viên cho tài khoản hiện tại"));

                log.info("User [{}] accessed own profile [employeeId={}]",
                                principal.getUsername(), employee.getId());

                return mapToPublicResponse(employee);
        }

        private PublicEmployeeResponse mapToPublicResponse(Employee employee) {
                if (employee == null)
                        return null;
                return PublicEmployeeResponse.builder()
                                .id(employee.getId())
                                .firstName(employee.getFirstName())
                                .lastName(employee.getLastName())
                                .email(employee.getEmail())
                                .phone(employee.getPhone())
                                .dateOfBirth(employee.getDateOfBirth())
                                .hireDate(employee.getHireDate())
                                .position(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                                .department(employee.getDepartment() != null ? employee.getDepartment().getName()
                                                : null)
                                .address(employee.getAddress())
                                .city(employee.getCity())
                                .state(employee.getState())
                                .country(employee.getCountry())
                                .status(employee.getStatus() != null ? employee.getStatus().name() : null)
                                .avatarUrl(employee.getAvatarUrl())
                                .createdAt(employee.getCreatedAt())
                                .updatedAt(employee.getUpdatedAt())
                                .build();
        }

        private EmployeeResponse mapToResponse(Employee employee) {
                if (employee == null)
                        return null;
                return EmployeeResponse.builder()
                                .id(employee.getId())
                                .firstName(employee.getFirstName())
                                .lastName(employee.getLastName())
                                .email(employee.getEmail())
                                .phone(employee.getPhone())
                                .dateOfBirth(employee.getDateOfBirth())
                                .hireDate(employee.getHireDate())
                                .position(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                                .department(employee.getDepartment() != null ? employee.getDepartment().getName()
                                                : null)

                                .address(employee.getAddress())
                                .city(employee.getCity())
                                .state(employee.getState())
                                .zipCode(employee.getZipCode())
                                .country(employee.getCountry())

                                .emergencyContactName(employee.getEmergencyContactName())
                                .emergencyContactPhone(employee.getEmergencyContactPhone())
                                .emergencyContactRelation(employee.getEmergencyContactRelation())

                                .taxId(employee.getTaxId())
                                .socialSecurityNumber(employee.getSocialSecurityNumber())
                                .nationalId(employee.getNationalId())

                                .bankAccountNumber(employee.getBankAccountNumber())
                                .bankName(employee.getBankName())
                                .bankBranch(employee.getBankBranch())

                                .reportingManagerId(employee.getReportingManager() != null
                                                ? employee.getReportingManager().getId()
                                                : null)
                                .reportingManagerName(employee.getReportingManager() != null
                                                ? employee.getReportingManager().getFullName()
                                                : null)

                                .contractType(employee.getContractType() != null ? employee.getContractType().name()
                                                : null)
                                .probationEndDate(employee.getProbationEndDate())
                                .contractEndDate(employee.getContractEndDate())
                                .workLocation(employee.getWorkLocation())

                                .nationality(employee.getNationality())
                                .bloodGroup(employee.getBloodGroup())
                                .gender(employee.getGender() != null ? employee.getGender().name() : null)

                                .annualLeaveBalance(employee.getAnnualLeaveBalance())
                                .sickLeaveBalance(employee.getSickLeaveBalance())

                                .avatarUrl(employee.getAvatarUrl())
                                .employeeCode(employee.getEmployeeCode())
                                .terminationDate(employee.getTerminationDate())
                                .notes(employee.getNotes())

                                .status(employee.getStatus() != null ? employee.getStatus().name() : null)
                                .createdAt(employee.getCreatedAt())
                                .updatedAt(employee.getUpdatedAt())
                                .build();
        }
}