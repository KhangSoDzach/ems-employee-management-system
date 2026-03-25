package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import com.company.ems.backend.leave.mapper.LeaveMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.user.repository.UserRepository;

import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auditlog.enums.AuditActionType;
import com.company.ems.backend.common.utils.AuditContextUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaveServiceImpl implements LeaveService {

        private static final String ENTITY_LEAVE = "Leave";
        private static final String ENTITY_USER = "User";
        private static final String ERROR_LEAVE_ID_NULL = "leave id must not be null";

        private final LeaveRepository leaveRepository;
        private final LeaveMapper leaveMapper;
        private final EmployeeRepository employeeRepository;
        private final UserRepository userRepository;
        private final DataScopeService dataScopeService;
        private final MessageService messages;
        private final AuditLogService auditLogService;

        @Override
        public LeaveResponse createLeaveRequest(LeaveRequest request) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Employee employee = employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER,
                                                                principal.getUserId())));

                // Validate dates
                if (request.getEndDate().isBefore(request.getStartDate())) {
                        throw new BusinessException("INVALID_DATE_RANGE",
                                        messages.get(MessageCode.LEAVE_INVALID_DATE_RANGE));
                }
                if (request.getStartDate().isBefore(LocalDate.now())) {
                        throw new BusinessException("INVALID_START_DATE",
                                        messages.get(MessageCode.LEAVE_INVALID_START_DATE));
                }

                Leave leave = Leave.builder()
                                .employee(employee)
                                .leaveType(LeaveType.valueOf(request.getLeaveType()))
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .reason(request.getReason())
                                .status(LeaveStatus.PENDING_LEVEL_1)
                                .build();
                leave.calculateTotalDays();

                Leave saved = leaveRepository.save(leave);
                log.info("User [{}] created leave request [{}]", principal.getUsername(), saved.getId());
                return leaveMapper.toResponse(saved);
        }

        @Override
        @Transactional(readOnly = true)
        public PageResponse<LeaveResponse> getMyLeaves(int page, int size) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                PageRequest pageable = PageRequest.of(page, size);

                Employee self = employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER,
                                                                principal.getUserId())));

                Page<Leave> leaves = leaveRepository.findByEmployeeId(self.getId(), pageable);

                List<LeaveResponse> content = leaves.getContent().stream()
                                .map(leaveMapper::toResponse)
                                .toList();

                return PageResponse.<LeaveResponse>builder()
                                .content(content)
                                .page(page).size(size)
                                .totalElements(leaves.getTotalElements())
                                .totalPages(leaves.getTotalPages())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public PageResponse<LeaveResponse> getAllLeaves(int page, int size, Long employeeId,
                        String status, String leaveType,
                        LocalDate startDate, LocalDate endDate) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                PageRequest pageable = PageRequest.of(page, size);
                Page<Leave> leaves;

                if (principal.hasDataScope(DataScope.ALL)) {
                        leaves = leaveRepository.findAll(pageable);
                } else if (principal.hasDataScope(DataScope.TEAM)) {
                        employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER,
                                                                        principal.getUserId())));
                        leaves = leaveRepository.findByReportingManagerUserId(principal.getUserId(), pageable);
                } else {
                        // SELF
                        Employee self = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER,
                                                                        principal.getUserId())));
                        leaves = leaveRepository.findByEmployeeId(self.getId(), pageable);
                }

                List<LeaveResponse> content = leaves.getContent().stream()
                                .map(leaveMapper::toResponse)
                                .toList();

                return PageResponse.<LeaveResponse>builder()
                                .content(content)
                                .page(page).size(size)
                                .totalElements(leaves.getTotalElements())
                                .totalPages(leaves.getTotalPages())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public LeaveResponse getLeaveById(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
                dataScopeService.assertCanAccessLeave(principal, id);
                Long leaveId = Objects.requireNonNull(id, ERROR_LEAVE_ID_NULL);
                Leave leave = leaveRepository.findById(leaveId)
                                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_LEAVE, "id", id));
                return leaveMapper.toResponse(leave);
        }

        @Override
        public LeaveResponse approveLeave(Long id, ApproveLeaveRequest request) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                // DataScope check: chỉ TEAM hoặc ALL scope
                dataScopeService.assertCanApproveLeave(principal, id);

                Long leaveId = Objects.requireNonNull(id, ERROR_LEAVE_ID_NULL);
                Leave leave = leaveRepository.findById(leaveId)
                                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_LEAVE, "id", id));

                if (!leave.isPending()) {
                        throw new BusinessException(
                                        messages.get(MessageCode.LEAVE_NOT_PENDING, leave.getStatus()));
                }

                if (leave.getEmployee().getUser() != null
                                && leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
                        throw new ForbiddenException();
                }

                Long approverUserId = Objects.requireNonNull(principal.getUserId(),
                                "principal userId must not be null");
                var approver = userRepository.findById(approverUserId)
                                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_USER, "id", approverUserId));

                String statusStr = request.getStatus().toUpperCase().trim();
                switch (statusStr) {
                        case "APPROVED" -> {
                                leave.approve(approver, request.getNotes());
                                log.info("User [{}] APPROVED leave [{}]", principal.getUsername(), id);
                                auditLogService.logEvent(
                                                "LEAVE_REQUEST",
                                                AuditActionType.WORKFLOW_APPROVE_LEAVE,
                                                principal.getUsername(),
                                                String.valueOf(leave.getId()),
                                                leave.getEmployee().getEmployeeCode(),
                                                new AuditLogService.AuditValues(null, "Notes: " + request.getNotes()),
                                                AuditContextUtils.getCurrentRequestContext());
                        }
                        case "REJECTED" -> {
                                leave.reject(approver, request.getNotes());
                                log.info("User [{}] REJECTED leave [{}]", principal.getUsername(), id);
                                auditLogService.logEvent(
                                                "LEAVE_REQUEST",
                                                AuditActionType.WORKFLOW_REJECT_LEAVE,
                                                principal.getUsername(),
                                                String.valueOf(leave.getId()),
                                                leave.getEmployee().getEmployeeCode(),
                                                new AuditLogService.AuditValues(null, "Notes: " + request.getNotes()),
                                                AuditContextUtils.getCurrentRequestContext());
                        }
                        default -> throw new BusinessException(
                                        messages.get(MessageCode.INVALID_STATUS, leave.getStatus()));
                }

                Leave updated = leaveRepository.save(leave);
                return leaveMapper.toResponse(updated);
        }

        @Override
        public void cancelLeave(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Long leaveId = Objects.requireNonNull(id, ERROR_LEAVE_ID_NULL);
                Leave leave = leaveRepository.findById(leaveId)
                                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_LEAVE, "id", id));
                if (leave.getEmployee().getUser() == null
                                || !leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
                        log.warn("User [{}] attempted to cancel leave [{}] belonging to another employee",
                                        principal.getUsername(), id);
                        throw new ForbiddenException();
                }

                if (!leave.isPending()) {
                        throw new BusinessException(
                                        messages.get(MessageCode.LEAVE_CANNOT_CANCEL, leave.getStatus()));
                }

                leave.cancel();
                leaveRepository.save(leave);
                log.info("User [{}] cancelled leave [{}]", principal.getUsername(), id);
        }
}