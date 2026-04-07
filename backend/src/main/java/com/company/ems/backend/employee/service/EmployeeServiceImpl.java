package com.company.ems.backend.employee.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.service.AttendanceService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.dto.EmployeeAttachmentResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.dto.OfficialContractRequest;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.entity.EmployeeAttachment;
import com.company.ems.backend.employee.enums.ContractType;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.enums.WorkStatus;
import com.company.ems.backend.employee.mapper.EmployeeMapper;
import com.company.ems.backend.employee.repository.EmployeeAttachmentRepository;
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

        /**
         * Date format for default password derivation: ddMMyy (e.g. 110299 for
         * 11/02/1999).
         */
        private static final DateTimeFormatter DOB_PASSWORD_FORMATTER = DateTimeFormatter.ofPattern("ddMMyy");
        private static final int MANAGER_LEVEL_THRESHOLD = 3;
        private static final List<Integer> ALLOWED_FIXED_TERM_MONTHS = List.of(12, 24, 36);
        private static final long MAX_EMPLOYEE_FILE_SIZE_BYTES = 10L * 1024 * 1024;
        private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "image/jpeg",
                        "image/png");
        private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/jpeg", "image/png");
        private static final String EMPLOYEE_UPLOAD_ROOT = "uploads/employee-files";
        private static final String EMPLOYEE_UPLOAD_PUBLIC_PREFIX = "/uploads/employee-files/";

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
        private final EmployeeAttachmentRepository employeeAttachmentRepository;

        @Override
        public EmployeeResponse createEmployee(EmployeeRequest request) {
                log.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());

                if (employeeRepository.existsByEmail(request.getEmail())) {
                        throw new BusinessException("DUPLICATE_EMAIL", "Email đã tồn tại trong hệ thống");
                }
                if (request.getNationalId() != null && employeeRepository.existsByNationalId(request.getNationalId())) {
                        throw new BusinessException("DUPLICATE_NATIONAL_ID", "CCCD/CMND đã tồn tại trong hệ thống");
                }
                if (request.getSocialSecurityNumber() != null
                                && employeeRepository.existsBySocialSecurityNumber(request.getSocialSecurityNumber())) {
                        throw new BusinessException("DUPLICATE_SOCIAL_SECURITY_NUMBER",
                                        "Số sổ BHXH đã tồn tại trong hệ thống");
                }
                if (request.getTaxId() != null && employeeRepository.existsByTaxId(request.getTaxId())) {
                        throw new BusinessException("DUPLICATE_TAX_ID", "Mã số thuế đã tồn tại trong hệ thống");
                }
                if (request.getBankAccountNumber() != null
                                && employeeRepository.existsByBankAccountNumber(request.getBankAccountNumber())) {
                        throw new BusinessException("DUPLICATE_BANK_ACCOUNT",
                                        "Số tài khoản ngân hàng đã tồn tại trong hệ thống");
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
                Double initialSalary = request.getSalary();
                if (initialSalary == null) {
                        initialSalary = 0d;
                }

                // ── Build linked User account ──────────────────────────────────────────
                User linkedUser = null;
                String rawPassword = null;
                if (request.getDateOfBirth() != null) {
                        rawPassword = buildDefaultPassword(employeeCode, request.getDateOfBirth());
                        Role assignedRole = resolveRoleForDepartment(department, position, request.getRoleId());
                        linkedUser = User.builder()
                                        .username(employeeCode)
                                        .email(request.getEmail())
                                        .password(passwordEncoder.encode(rawPassword))
                                        .roles(new HashSet<>(Set.of(assignedRole)))
                                        .build();
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
                                .probationEndDate(request.getProbationEndDate())
                                .probationSalary(initialSalary)
                                .officialSalary(request.getOfficialSalary())
                                .workLocation(request.getWorkLocation())

                                .nationality(request.getNationality())
                                .bloodGroup(request.getBloodGroup())
                                .gender(request.getGender())
                                .avatarUrl(request.getAvatarUrl())
                                .notes(request.getNotes())
                                .salary(initialSalary)
                                .status(EmployeeStatus.ACTIVE)
                                .workStatus(WorkStatus.PROBATION)
                                .build();

                applyContractRules(employee, request.getContractType(), request.getContractStartDate(),
                                request.getContractDurationMonths(), request.getContractEndDate());

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
                        String position, String status, String search, boolean includeDeleted) {
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

                // Convert String status -> WorkStatus enum (null if blank or invalid)
                WorkStatus statusFilter = null;
                if (status != null && !status.isBlank()) {
                        try {
                                statusFilter = WorkStatus.valueOf(status.toUpperCase());
                        } catch (IllegalArgumentException ignored) {
                                log.warn("Invalid status filter value: '{}'", status);
                        }
                }

                Page<Employee> employees;

                if (includeDeleted) {
                        // Archived tab: only show deleted employees
                        employees = employeeRepository.searchArchivedEmployees(search, pageable);
                } else if (principal.hasDataScope(DataScope.ALL)) {
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
                if (request.getSocialSecurityNumber() != null
                                && !request.getSocialSecurityNumber().equals(employee.getSocialSecurityNumber())
                                && employeeRepository.existsBySocialSecurityNumber(request.getSocialSecurityNumber())) {
                        throw new BusinessException("DUPLICATE_SOCIAL_SECURITY_NUMBER",
                                        "Số sổ BHXH đã tồn tại trong hệ thống");
                }
                if (request.getTaxId() != null && !request.getTaxId().equals(employee.getTaxId())
                                && employeeRepository.existsByTaxId(request.getTaxId())) {
                        throw new BusinessException("DUPLICATE_TAX_ID", "Mã số thuế đã tồn tại trong hệ thống");
                }
                if (request.getBankAccountNumber() != null
                                && !request.getBankAccountNumber().equals(employee.getBankAccountNumber())
                                && employeeRepository.existsByBankAccountNumber(request.getBankAccountNumber())) {
                        throw new BusinessException("DUPLICATE_BANK_ACCOUNT",
                                        "Số tài khoản ngân hàng đã tồn tại trong hệ thống");
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
                // Keep the linked User account in sync with the employee's new email
                if (employee.getUser() != null) {
                        employee.getUser().setEmail(request.getEmail());
                }
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
                employee.setProbationEndDate(request.getProbationEndDate());
                employee.setContractDurationMonths(request.getContractDurationMonths());
                employee.setProbationSalary(request.getProbationSalary());
                employee.setOfficialSalary(request.getOfficialSalary());
                employee.setWorkLocation(request.getWorkLocation());

                applyContractRules(employee, request.getContractType(), request.getContractStartDate(),
                                request.getContractDurationMonths(), request.getContractEndDate());

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
        public EmployeeResponse convertToOfficial(Long id, OfficialContractRequest request) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                dataScopeService.assertCanAccessEmployee(principal, id);

                Employee employee = employeeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

                if (employee.getWorkStatus() != WorkStatus.PROBATION) {
                        throw new BusinessException("EMPLOYEE_NOT_IN_PROBATION",
                                        "Chỉ nhân viên ở trạng thái thử việc mới có thể xác nhận chính thức");
                }

                String contractTerm = request.getContractTerm() != null
                                ? request.getContractTerm().trim().toUpperCase()
                                : "";

                LocalDate contractEndDate;
                switch (contractTerm) {
                        case "ONE_YEAR" -> {
                                contractEndDate = request.getContractStartDate().plusYears(1).minusDays(1);
                                employee.setContractType(ContractType.CONTRACT);
                                employee.setContractDurationMonths(12);
                        }
                        case "TWO_YEARS" -> {
                                contractEndDate = request.getContractStartDate().plusYears(2).minusDays(1);
                                employee.setContractType(ContractType.CONTRACT);
                                employee.setContractDurationMonths(24);
                        }
                        case "THREE_YEARS" -> {
                                contractEndDate = request.getContractStartDate().plusYears(3).minusDays(1);
                                employee.setContractType(ContractType.CONTRACT);
                                employee.setContractDurationMonths(36);
                        }
                        case "INDEFINITE" -> {
                                contractEndDate = null;
                                employee.setContractType(ContractType.FULL_TIME);
                                employee.setContractDurationMonths(null);
                        }
                        default ->
                                throw new BusinessException("INVALID_CONTRACT_TERM",
                                                "Loại hợp đồng không hợp lệ. Chỉ chấp nhận ONE_YEAR, TWO_YEARS, THREE_YEARS hoặc INDEFINITE");
                }

                if (("ONE_YEAR".equals(contractTerm) || "TWO_YEARS".equals(contractTerm)
                                || "THREE_YEARS".equals(contractTerm))
                                && contractEndDate == null) {
                        throw new BusinessException("INVALID_CONTRACT_END_DATE",
                                        "Hợp đồng có thời hạn bắt buộc phải có ngày hết hạn");
                }

                if (employee.getProbationSalary() == null) {
                        employee.setProbationSalary(employee.getSalary());
                }

                employee.setContractStartDate(request.getContractStartDate());
                employee.setContractEndDate(contractEndDate);
                employee.setOfficialSalary(request.getOfficialSalary());
                employee.setSalary(request.getOfficialSalary());
                employee.setWorkStatus(WorkStatus.ACTIVE);
                employee.setStatus(EmployeeStatus.ACTIVE);

                Employee updated = employeeRepository.save(employee);
                log.info("User [{}] confirmed employee [{}] from probation to official", principal.getUsername(), id);
                return employeeMapper.toResponse(updated);
        }

        @Override
        public String uploadEmployeeFile(Long id, MultipartFile file, String fileType) {
                if (file == null || file.isEmpty()) {
                        throw new BusinessException("EMPTY_FILE", "Tệp tải lên không được để trống");
                }
                if (file.getSize() > MAX_EMPLOYEE_FILE_SIZE_BYTES) {
                        throw new BusinessException("FILE_TOO_LARGE", "Kích thước tệp vượt quá 10MB");
                }

                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                dataScopeService.assertCanAccessEmployee(principal, id);

                Employee employee = employeeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

                String normalizedType = fileType == null ? "DOCUMENT" : fileType.trim().toUpperCase();
                boolean isAvatar = "AVATAR".equals(normalizedType);

                String contentType = file.getContentType() == null ? "" : file.getContentType();
                if (isAvatar && !ALLOWED_AVATAR_TYPES.contains(contentType)) {
                        throw new BusinessException("INVALID_AVATAR_TYPE", "Ảnh đại diện chỉ chấp nhận JPG hoặc PNG");
                }
                if (!isAvatar && !ALLOWED_DOCUMENT_TYPES.contains(contentType)) {
                        throw new BusinessException("INVALID_DOCUMENT_TYPE",
                                        "Tài liệu chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG");
                }

                String relativePath = storeEmployeeFile(file, employee, isAvatar ? "avatars" : "documents");
                String fileUrl = EMPLOYEE_UPLOAD_PUBLIC_PREFIX + relativePath;

                if (isAvatar) {
                        employee.setAvatarUrl(fileUrl);
                        employeeRepository.save(employee);
                        return fileUrl;
                }

                EmployeeAttachment attachment = EmployeeAttachment.builder()
                                .employee(employee)
                                .originalFileName(file.getOriginalFilename() != null ? file.getOriginalFilename()
                                                : "unknown")
                                .storedFileName(Paths.get(relativePath).getFileName().toString())
                                .fileUrl(fileUrl)
                                .fileType(contentType)
                                .fileSize(file.getSize())
                                .build();
                employeeAttachmentRepository.save(attachment);
                return fileUrl;
        }

        @Override
        @Transactional(readOnly = true)
        public List<EmployeeAttachmentResponse> getEmployeeAttachments(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                dataScopeService.assertCanAccessEmployee(principal, id);

                return employeeAttachmentRepository.findByEmployeeIdAndIsDeletedFalseOrderByCreatedAtDesc(id)
                                .stream()
                                .map(this::toAttachmentResponse)
                                .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public List<EmployeeAttachmentResponse> getMyEmployeeAttachments() {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                Employee employee = employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Không tìm thấy hồ sơ nhân viên cho tài khoản hiện tại"));

                return employeeAttachmentRepository
                                .findByEmployeeIdAndIsDeletedFalseOrderByCreatedAtDesc(employee.getId())
                                .stream()
                                .map(this::toAttachmentResponse)
                                .toList();
        }

        @Override
        public void deleteEmployeeAttachment(Long id, Long attachmentId) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                dataScopeService.assertCanAccessEmployee(principal, id);

                EmployeeAttachment attachment = employeeAttachmentRepository
                                .findByIdAndEmployeeIdAndIsDeletedFalse(attachmentId, id)
                                .orElseThrow(() -> new ResourceNotFoundException("EmployeeAttachment", "id",
                                                attachmentId));

                deleteStoredEmployeeFile(attachment.getFileUrl());
                attachment.softDelete(principal.getUsername());
                employeeAttachmentRepository.save(attachment);
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
                employee.setWorkStatus(WorkStatus.TERMINATED);
                if (employee.getTerminationDate() == null) {
                        employee.setTerminationDate(LocalDate.now());
                }
                employeeRepository.save(employee);
                log.info("User [{}] soft-deleted employee [{}]", principal.getUsername(), id);
        }

        @Override
        public void restoreEmployee(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                if (!principal.hasDataScope(DataScope.ALL)) {
                        throw new ForbiddenException();
                }

                Employee employee = employeeRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

                if (employee.getIsDeleted() == null || !employee.getIsDeleted()) {
                        throw new BusinessException("EMPLOYEE_NOT_DELETED", "Nhân viên này chưa bị xóa");
                }

                employee.restore();
                employee.setStatus(EmployeeStatus.ACTIVE);
                employee.setWorkStatus(WorkStatus.ACTIVE);
                employeeRepository.save(employee);
                log.info("User [{}] restored employee [{}]", principal.getUsername(), id);
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

                } else if (principal.hasDataScope(DataScope.SELF)) {
                        // Employee: thấy các thành viên cùng nhóm (cùng reporting manager)
                        Employee self = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));

                        if (self.getReportingManager() == null) {
                                return PageResponse.<MemberResponse>builder()
                                                .content(List.of(mapToMemberResponse(self)))
                                                .page(0)
                                                .size(1)
                                                .totalElements(1L)
                                                .totalPages(1)
                                                .build();
                        }

                        employees = employeeRepository.searchEmployeesFor360ByManagerGroup(
                                        self.getReportingManager().getId(),
                                        search,
                                        null,
                                        null,
                                        null,
                                        pageable);

                } else {
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
                if (employee == null)
                        return null;
                return MemberResponse.builder()
                                .id(employee.getId())
                                .userId(employee.getUser() != null ? employee.getUser().getId() : null)
                                .employeeCode(employee.getEmployeeCode())
                                .fullName(employee.getFullName())
                                .email(employee.getEmail())
                                .avatarUrl(employee.getAvatarUrl())
                                .positionTitle(employee.getPosition() != null ? employee.getPosition().getTitle()
                                                : null)
                                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName()
                                                : null)
                                .status(employee.getStatus() != null ? employee.getStatus().name() : null)
                                .build();
        }

        private EmployeeAttachmentResponse toAttachmentResponse(EmployeeAttachment attachment) {
                return EmployeeAttachmentResponse.builder()
                                .id(attachment.getId())
                                .originalFileName(attachment.getOriginalFileName())
                                .fileUrl(attachment.getFileUrl())
                                .fileType(attachment.getFileType())
                                .fileSize(attachment.getFileSize())
                                .createdAt(attachment.getCreatedAt())
                                .build();
        }

        /**
         * Derives the default login password: {@code employeeCode + DOB(ddMMyy)}.
         * <p>
         * Example: code {@code IT202600001} + DOB {@code 1999-02-11} =>
         * {@code IT202600001110299}.
         */
        private String buildDefaultPassword(String employeeCode, LocalDate dateOfBirth) {
                return employeeCode + dateOfBirth.format(DOB_PASSWORD_FORMATTER);
        }

        private String storeEmployeeFile(MultipartFile file, Employee employee, String categoryFolder) {
                String safeCode = employee.getEmployeeCode() != null
                                ? employee.getEmployeeCode().replaceAll("[^a-zA-Z0-9_\\-]", "_")
                                : String.valueOf(employee.getId());
                String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
                String storedFilename = UUID.randomUUID() + (extension != null ? "." + extension : "");

                Path folderPath = Paths.get(EMPLOYEE_UPLOAD_ROOT, safeCode, categoryFolder);
                try {
                        Files.createDirectories(folderPath);
                        Path targetFile = folderPath.resolve(storedFilename);
                        file.transferTo(targetFile);
                        return Paths.get(safeCode, categoryFolder, storedFilename).toString().replace('\\', '/');
                } catch (IOException e) {
                        throw new BusinessException("EMPLOYEE_FILE_STORE_FAILED", "Không thể lưu tệp nhân viên");
                }
        }

        private void deleteStoredEmployeeFile(String fileUrl) {
                if (fileUrl == null || fileUrl.isBlank() || !fileUrl.startsWith(EMPLOYEE_UPLOAD_PUBLIC_PREFIX)) {
                        return;
                }
                String relativePath = fileUrl.substring(EMPLOYEE_UPLOAD_PUBLIC_PREFIX.length());
                try {
                        Files.deleteIfExists(Paths.get(EMPLOYEE_UPLOAD_ROOT, relativePath));
                } catch (IOException e) {
                        log.warn("Cannot delete employee file [{}]: {}", fileUrl, e.getMessage());
                }
        }

        private void applyContractRules(Employee employee, ContractType contractType,
                        LocalDate contractStartDate,
                        Integer contractDurationMonths,
                        LocalDate contractEndDate) {
                employee.setContractType(contractType);
                employee.setContractStartDate(contractStartDate);

                if (ContractType.CONTRACT.equals(contractType)) {
                        if (contractStartDate == null) {
                                throw new BusinessException("MISSING_CONTRACT_START_DATE",
                                                "Hợp đồng có thời hạn bắt buộc phải có ngày bắt đầu");
                        }
                        if (contractDurationMonths == null
                                        || !ALLOWED_FIXED_TERM_MONTHS.contains(contractDurationMonths)) {
                                throw new BusinessException("INVALID_CONTRACT_DURATION",
                                                "Hợp đồng có thời hạn chỉ được phép 12, 24 hoặc 36 tháng");
                        }
                        employee.setContractDurationMonths(contractDurationMonths);
                        employee.setContractEndDate(contractStartDate.plusMonths(contractDurationMonths).minusDays(1));
                        return;
                }

                employee.setContractDurationMonths(null);
                employee.setContractEndDate(contractEndDate);
        }

        /**
         * Resolve role based on department code and position level.
         * Mapping:
         * - ADMIN dept → ROLE_ADMIN
         * - HR dept → ROLE_HR
         * - Other dept + position level >= 3 → ROLE_MANAGER
         * - Other dept + position level < 3 → ROLE_EMPLOYEE
         * If roleId is explicitly provided, use that instead.
         */
        private Role resolveRoleForDepartment(Department department, Position position, Long explicitRoleId) {
                if (explicitRoleId != null) {
                        return roleRepository.findById(explicitRoleId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Role", "id", explicitRoleId));
                }

                String deptCode = department.getCode();
                if ("ADMIN".equals(deptCode)) {
                        return roleRepository.findByName("ROLE_ADMIN")
                                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_ADMIN"));
                }
                if ("HR".equals(deptCode)) {
                        return roleRepository.findByName("ROLE_HR")
                                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_HR"));
                }

                Integer level = position.getLevel();
                if (level != null && level >= MANAGER_LEVEL_THRESHOLD) {
                        return roleRepository.findByName("ROLE_MANAGER")
                                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name",
                                                        "ROLE_MANAGER"));
                }

                return roleRepository.findByName("ROLE_EMPLOYEE")
                                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_EMPLOYEE"));
        }
}