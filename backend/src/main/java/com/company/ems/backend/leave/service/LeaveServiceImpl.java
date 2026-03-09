package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;

import com.company.ems.backend.leave.enums.LeaveType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaveServiceImpl implements LeaveService {

        private final LeaveRepository leaveRepository;
        private final EmployeeRepository employeeRepository;
        private final UserRepository userRepository;
        private final DataScopeService dataScopeService;
        private final MessageService messages;

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
                                .status(LeaveStatus.PENDING)
                                .build();
                leave.calculateTotalDays();

                Leave saved = leaveRepository.save(leave);
                log.info("User [{}] created leave request [{}]", principal.getUsername(), saved.getId());
                return mapToResponse(saved);
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
                        Employee manager = employeeRepository.findByUserId(principal.getUserId())
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
                                .map(this::mapToResponse)
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
                Leave leave = leaveRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));
                return mapToResponse(leave);
        }

        /**
         * Approve hoặc Reject leave.
         *
         * request.status = "APPROVED" hoặc "REJECTED"
         * request.notes = ghi chú của người duyệt (nullable)
         *
         * DataScope: assertCanApproveLeave đã kiểm tra TEAM/ALL scope.
         */
        @Override
        public LeaveResponse approveLeave(Long id, ApproveLeaveRequest request) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                // DataScope check: chỉ TEAM hoặc ALL scope
                dataScopeService.assertCanApproveLeave(principal, id);

                Leave leave = leaveRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));

                if (leave.getStatus() != LeaveStatus.PENDING) {
                        throw new BusinessException("LEAVE_NOT_PENDING",
                                        messages.get(MessageCode.LEAVE_NOT_PENDING, leave.getStatus()));
                }

                // Không cho tự approve leave của chính mình
                if (leave.getEmployee().getUser() != null
                                && leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
                        throw new ForbiddenException(messages.get(MessageCode.LEAVE_CANNOT_SELF_APPROVE));
                }

                // Lấy User của người duyệt
                var approver = userRepository.findById(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getUserId()));

                String statusStr = request.getStatus().toUpperCase().trim();
                if ("APPROVED".equals(statusStr)) {
                        leave.approve(approver, request.getNotes());
                        log.info("User [{}] APPROVED leave [{}]", principal.getUsername(), id);
                } else if ("REJECTED".equals(statusStr)) {
                        leave.reject(approver, request.getNotes());
                        log.info("User [{}] REJECTED leave [{}]", principal.getUsername(), id);
                } else {
                        throw new BusinessException("INVALID_STATUS",
                                        messages.get(MessageCode.LEAVE_INVALID_STATUS, request.getStatus()));
                }

                Leave updated = leaveRepository.save(leave);
                return mapToResponse(updated);
        }

        @Override
        public void cancelLeave(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Leave leave = leaveRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));

                // Ownership check: chỉ chủ nhân mới được hủy
                if (leave.getEmployee().getUser() == null
                                || !leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
                        log.warn("User [{}] attempted to cancel leave [{}] belonging to another employee",
                                        principal.getUsername(), id);
                        throw new ForbiddenException();
                }

                if (leave.getStatus() != LeaveStatus.PENDING) {
                        throw new BusinessException("LEAVE_CANNOT_CANCEL",
                                        messages.get(MessageCode.LEAVE_CANNOT_CANCEL, leave.getStatus()));
                }

                leave.cancel();
                leaveRepository.save(leave);
                log.info("User [{}] cancelled leave [{}]", principal.getUsername(), id);
        }

        // ─── Private helpers ──────────────────────────────────────────────────────

        private LeaveResponse mapToResponse(Leave leave) {
                if (leave == null)
                        return null;
                return LeaveResponse.builder()
                                .id(leave.getId())
                                .employeeId(leave.getEmployee() != null ? leave.getEmployee().getId() : null)
                                .employeeName(leave.getEmployee() != null && leave.getEmployee().getUser() != null
                                                ? leave.getEmployee().getFirstName() + " "
                                                                + leave.getEmployee().getLastName()
                                                : null)
                                .leaveType(leave.getLeaveType() != null ? leave.getLeaveType().name() : null)
                                .startDate(leave.getStartDate())
                                .endDate(leave.getEndDate())
                                .duration(leave.getTotalDays())
                                .reason(leave.getReason())
                                .status(leave.getStatus() != null ? leave.getStatus().name() : null)
                                .attachmentUrl(leave.getAttachmentUrl())
                                .approvedBy(leave.getApprovedBy() != null ? leave.getApprovedBy().getId() : null)
                                .approvedAt(leave.getApprovedAt())
                                .approvalNotes(leave.getApprovalNotes())
                                .createdAt(leave.getCreatedAt())
                                .build();
        }
}