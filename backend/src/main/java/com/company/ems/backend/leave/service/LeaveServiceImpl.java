package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
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
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaveServiceImpl implements LeaveService {

        private static final String ENTITY_LEAVE = "Leave";
        private static final String ERROR_LEAVE_ID_NULL = "leave id must not be null";
                private static final int DEFAULT_APPROVAL_LEVEL = 1;
                private static final String STATUS_APPROVED = "APPROVED";
                private static final String STATUS_REJECTED = "REJECTED";
                private static final String STATUS_RETURNED_TO_EMPLOYEE = "RETURNED_TO_EMPLOYEE";

    private final LeaveRepository leaveRepository;
    private final LeaveMapper leaveMapper;
    private final EmployeeRepository employeeRepository;
    private final DataScopeService dataScopeService;
        private final LeaveApprovalService leaveApprovalService;
        private final LeaveBalanceService leaveBalanceService;
        private final WorkflowEngineService workflowEngineService;
    private final MessageService messages;

        @Value("${app.workflow.leave.long-leave-extra-level-role:ROLE_HR}")
        private String longLeaveExtraLevelRole;

    @Override
    public LeaveResponse createLeaveRequest(LeaveRequest request) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        Employee employee = employeeRepository.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER, principal.getUserId())));

        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("INVALID_DATE_RANGE",
                    messages.get(MessageCode.LEAVE_INVALID_DATE_RANGE ));
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BusinessException("INVALID_START_DATE",
                    messages.get(MessageCode.LEAVE_INVALID_START_DATE ));
        }

        Leave leave = Leave.builder()
                .employee(employee)
                .leaveType(LeaveType.fromRequest(request.getLeaveType()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(LeaveStatus.PENDING_LEVEL_1)
                .build();
        leave.calculateTotalDays();

        // 1. Check and reserve balance
        if (!leaveBalanceService.hasSufficientBalance(employee.getId(), leave.getLeaveType(),
                        leave.getTotalDays().intValue())) {
                throw new BusinessException("INSUFFICIENT_BALANCE",
                                messages.get(MessageCode.LEAVE_INSUFFICIENT_BALANCE));
        }
        leaveBalanceService.reserveBalance(employee.getId(), leave.getLeaveType(),
                        leave.getTotalDays().intValue());

        initialiseLeaveWorkflow(leave);

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
                        messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER, principal.getUserId())));

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
            leaves = leaveRepository.findByReportingManagerUserId(principal.getUserId(), pageable);
        } else {
            // SELF
            Employee self = employeeRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER, principal.getUserId())));
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
    @Transactional(readOnly = true)
    public PageResponse<LeaveResponse> getPendingForApprover(int page, int size) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        List<String> approverRoles = principal.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .distinct()
                .toList();

        boolean hasApprovalRole = approverRoles.stream()
                .anyMatch(role -> "ROLE_MANAGER".equals(role)
                        || "ROLE_HR".equals(role)
                        || "ROLE_ADMIN".equals(role));
        if (!hasApprovalRole) {
            throw new ForbiddenException();
        }

        Long myEmployeeId = null;
        try {
            myEmployeeId = resolveEmployeeByUserId(principal.getUserId()).getId();
        } catch (ResourceNotFoundException ignored) {
            // Some approvers (e.g. admin) may not have an employee record.
        }

        List<LeaveStatus> pendingStatuses = List.of(
                LeaveStatus.PENDING_LEVEL_1,
                LeaveStatus.PENDING_LEVEL_2,
                LeaveStatus.PENDING_LEVEL_3,
                LeaveStatus.PENDING_LEVEL_4,
                LeaveStatus.PENDING_LEVEL_5);

        boolean canApproveLongLeaveFallback = approverRoles.contains(longLeaveExtraLevelRole);

        Page<Leave> leaves = leaveRepository.findPendingForApprover(
                pendingStatuses,
                approverRoles,
                principal.getUserId(),
                myEmployeeId,
                canApproveLongLeaveFallback,
                PageRequest.of(page, size));

        List<LeaveResponse> content = leaves.getContent().stream()
                .map(leaveMapper::toResponse)
                .toList();

        return PageResponse.<LeaveResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(leaves.getTotalElements())
                .totalPages(leaves.getTotalPages())
                .build();
    }

    @Override
    public LeaveResponse approveLeave(Long id, ApproveLeaveRequest request) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        LeaveApprovalAction action = mapActionFromStatus(request.getStatus());
        LeaveApprovalRequest approvalRequest = new LeaveApprovalRequest();
        approvalRequest.setAction(action);
        approvalRequest.setComments(request.getNotes());

        return leaveApprovalService.processApproval(id, principal.getUserId(), approvalRequest);
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

        // Unreserve balance as the request is no longer pending
        leaveBalanceService.returnReservedBalance(
                        leave.getEmployee().getId(),
                        leave.getLeaveType(),
                        leave.getTotalDays().intValue());

        log.info("User [{}] cancelled leave [{}]", principal.getUsername(), id);
    }

        private void initialiseLeaveWorkflow(Leave leave) {
                try {
                        var template = workflowEngineService.getActiveTemplate(WorkflowType.LEAVE);
                        leaveApprovalService.initialiseApprovalLevels(leave, template);
                } catch (BusinessException ex) {
                        // Keep create flow available in environments where leave workflow is not configured yet.
                        log.warn("No active LEAVE workflow template found. Falling back to single-level approval. Cause: {}",
                                        ex.getMessage());
                        leave.setWorkflowTemplateId(null);
                        leave.setCurrentApprovalLevel(DEFAULT_APPROVAL_LEVEL);
                        leave.setMaxApprovalLevel(DEFAULT_APPROVAL_LEVEL);
                        leave.setLongLeaveHrRequired(false);
                        leave.setStatus(LeaveStatus.PENDING_LEVEL_1);
                }
        }

        private LeaveApprovalAction mapActionFromStatus(String status) {
                String normalized = status == null ? "" : status.trim().toUpperCase();
                return switch (normalized) {
                        case STATUS_APPROVED -> LeaveApprovalAction.APPROVE;
                        case STATUS_REJECTED -> LeaveApprovalAction.REJECT;
                        case STATUS_RETURNED_TO_EMPLOYEE -> LeaveApprovalAction.SEND_BACK;
                        default -> throw new BusinessException(messages.get(MessageCode.LEAVE_INVALID_STATUS, status));
                };
        }

        private Employee resolveEmployeeByUserId(Long userId) {
                return employeeRepository.findByUserId(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER, userId)));
        }
}