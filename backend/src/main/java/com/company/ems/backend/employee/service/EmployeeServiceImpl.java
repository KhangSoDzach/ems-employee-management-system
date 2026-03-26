package com.company.ems.backend.employee.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.service.AttendanceService;
import com.company.ems.backend.employee.mapper.EmployeeMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.service.LeaveBalanceService;
import com.company.ems.backend.position.entity.Position;
import com.company.ems.backend.position.repository.PositionRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.entity.Role;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.user.repository.RoleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

        /** Date format for default password derivation: ddMMyy (e.g. 110299 for 11/02/1999). */
        private static final DateTimeFormatter DOB_PASSWORD_FORMATTER = DateTimeFormatter.ofPattern("ddMMyy");

        private final EmployeeRepository employeeRepository;
        private final EmployeeMapper employeeMapper;
        private final DepartmentRepository departmentRepository;
        private final PositionRepository positionRepository;
        private final DataScopeService dataScopeService;
        private final EmployeeEmailNotificationService emailNotificationService;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final LeaveBalanceService leaveBalanceService;
        private final AttendanceService attendanceService;

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

                // ── Build linked User account ──────────────────────────────────────────
                User linkedUser = null;
                String rawPassword = null;
                if (request.getDateOfBirth() != null) {
                        rawPassword = buildDefaultPassword(employeeCode, request.getDateOfBirth());
                        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_EMPLOYEE"));
                        linkedUser = User.builder()
                                        .username(employeeCode)
                                        .email(request.getEmail())
                                        .password(passwordEncoder.encode(rawPassword))
                                        .build();
                        linkedUser.getRoles().add(employeeRole);
                }

                Employee employee = Employee.builder().user(linkedUser)
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
                                .salary(request.getSalary() != null ? request.getSalary() : 0.0)
                                .status(EmployeeStatus.ACTIVE)
                                .build();

                Employee saved = employeeRepository.save(employee);

                int currentYear = LocalDate.now().getYear();
                leaveBalanceService.initializeDefaultBalancesForEmployee(saved.getId(), currentYear);

                // ── Async email notification ──────────────────────────────────
                // Send default credentials to the employee's registered email.
                // The email is dispatched on a separate thread so it never
                // blocks or rolls back the creation transaction.
                if (rawPassword != null) {
                        emailNotificationService.notifyNewEmployeeAsync(
                                        saved.getEmail(),
                                        saved.getFirstName() + " " + saved.getLastName(),
                                        saved.getEmployeeCode(),
                                        rawPassword);
                } else {
                        log.warn("[EMS-EMAIL] Skipping credentials email for employee [{}]: dateOfBirth is null",
                                        saved.getEmployeeCode());
                }

                return employeeMapper.toResponse(saved);
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

                // Convert String status -> EmployeeStatus enum (null if blank or invalid)
                EmployeeStatus statusFilter = null;
                if (status != null && !status.isBlank()) {
                        try {
                                statusFilter = EmployeeStatus.valueOf(status.toUpperCase());
                        } catch (IllegalArgumentException ignored) {
                                log.warn("Invalid status filter value: '{}'", status);
                        }
                }

                Page<Employee> employees;

                if (principal.hasDataScope(DataScope.ALL)) {
                        // HR Admin: xem tất cả với filter
                        employees = employeeRepository.searchEmployees(search, departmentIdFilter, positionIdFilter,
                                        statusFilter, pageable);

                } else if (principal.hasDataScope(DataScope.TEAM)) {
                        // Manager: chỉ xem team của mình
                        Employee managerEmployee = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));

                        employees = employeeRepository.searchEmployeesByManager(managerEmployee.getId(), search,
                                        departmentIdFilter, positionIdFilter, statusFilter, pageable);

                } else {
                        // Employee (SELF): chỉ thấy chính mình
                        Employee self = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));
                        // Wrap single result as page
                        return PageResponse.<EmployeeResponse>builder()
                                        .content(List.of(employeeMapper.toResponse(self)))
                                        .page(0).size(1).totalElements(1L).totalPages(1)
                                        .build();
                }

                List<EmployeeResponse> content = employees.getContent().stream()
                                .map(employeeMapper::toResponse)
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

                return employeeMapper.toResponse(employee);
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
                if (request.getSalary() != null) {
                        employee.setSalary(request.getSalary());
                }

                Employee updated = employeeRepository.save(employee);
                log.info("User [{}] updated employee [{}]", principal.getUsername(), id);

                return employeeMapper.toResponse(updated);
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

                // Soft delete: mark as deleted, set status TERMINATED
                employee.softDelete(principal.getUsername());
                employee.setStatus(EmployeeStatus.TERMINATED);
                if (employee.getTerminationDate() == null) {
                        employee.setTerminationDate(LocalDate.now());
                }
                employeeRepository.save(employee);
                log.info("User [{}] soft-deleted employee [{}]", principal.getUsername(), id);
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

                PublicEmployeeResponse response = employeeMapper.toPublicResponse(employee);

                int annualRemaining = leaveBalanceService.getRemainingDays(employee.getId(), LeaveType.ANNUAL);
                response.setAnnualLeaveBalance(annualRemaining);

                if (employee.getSickLeaveBalance() != null) {
                        response.setSickLeaveBalance(employee.getSickLeaveBalance());
                }
                if (employee.getReportingManager() != null) {
                        response.setReportingManagerId(employee.getReportingManager().getId());
                        response.setReportingManagerName(employee.getReportingManager().getFullName());
                }

                LocalDate today = LocalDate.now();
                LocalDate firstDayOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
                AttendanceSummaryResponse summary = attendanceService.getSummary(
                                employee.getId(), firstDayOfMonth, today, principal);
                response.setAttendancePercentage(summary.getAttendancePercentage());

                return response;
        }

        @Override
        @Transactional(readOnly = true)
        public List<Map<String, Object>> getManagers() {
                // Trả danh sách nhân viên ACTIVE có vị trí là manager (level == 3) - Không lấy
                // ADMIN
                return employeeRepository.findAll().stream()
                                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE
                                                && e.getPosition() != null
                                                && e.getPosition().getLevel() != null
                                                && e.getPosition().getLevel() == 3)
                                .map(e -> Map.<String, Object>of(
                                                "id", e.getId(),
                                                "name", e.getFullName(),
                                                "position", e.getPosition().getTitle()))
                                .collect(java.util.stream.Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public PageResponse<MemberResponse> getTeamMembers(int page, int size, String search) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                PageRequest pageable = PageRequest.of(page, size);

                Page<Employee> employees;

                if (principal.hasDataScope(DataScope.ALL)) {
                        // HR / Admin: có thể thấy tất cả nhân viên
                        employees = employeeRepository.searchEmployees(
                                        search, null, null, null, pageable);

                } else if (principal.hasDataScope(DataScope.TEAM)) {
                        // Manager: chỉ thấy nhân viên trong team của mình
                        Employee managerEmployee = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));

                        employees = employeeRepository.searchEmployeesByManager(
                                        managerEmployee.getId(), search, null, null, null, pageable);

                } else {
                        // SELF scope không được dùng endpoint này
                        throw new ForbiddenException();
                }

                List<MemberResponse> content = employees.getContent().stream()
                                .map(this::mapToMemberResponse)
                                .toList();

                return PageResponse.<MemberResponse>builder()
                                .content(content)
                                .page(page)
                                .size(size)
                                .totalElements(employees.getTotalElements())
                                .totalPages(employees.getTotalPages())
                                .build();
        }

        /**
         * Maps an Employee to a slim MemberResponse (no sensitive fields).
         */
        private MemberResponse mapToMemberResponse(Employee employee) {
                if (employee == null) return null;
                return MemberResponse.builder()
                                .id(employee.getId())
                                .employeeCode(employee.getEmployeeCode())
                                .fullName(employee.getFullName())
                                .email(employee.getEmail())
                                .avatarUrl(employee.getAvatarUrl())
                                .positionTitle(employee.getPosition() != null ? employee.getPosition().getTitle() : null)
                                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                                .status(employee.getStatus() != null ? employee.getStatus().name() : null)
                                .build();
        }

        /**
         * Derives the default login password: {@code employeeCode + DOB(ddMMyy)}.
         * <p>Example: code {@code IT202600001} + DOB {@code 1999-02-11} => {@code IT202600001110299}.
         */
        private String buildDefaultPassword(String employeeCode, LocalDate dateOfBirth) {
                return employeeCode + dateOfBirth.format(DOB_PASSWORD_FORMATTER);
        }
}