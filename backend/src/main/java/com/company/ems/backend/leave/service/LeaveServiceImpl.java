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
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Orchestrates leave request lifecycle (create, list, cancel).
 * Approval actions are delegated to {@link LeaveApprovalService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaveServiceImpl implements LeaveService {

        private final LeaveRepository leaveRepository;
        private final EmployeeRepository employeeRepository;
        private final DataScopeService dataScopeService;
        private final WorkflowEngineService workflowEngineService;
        private final LeaveApprovalService leaveApprovalService;
        private final LeaveBalanceService leaveBalanceService;

        @Override
        public LeaveResponse createLeaveRequest(LeaveRequest request) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Employee employee = employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Employee record không tồn tại cho userId: " + principal.getUserId()));

                // Validate dates
                if (request.getEndDate().isBefore(request.getStartDate())) {
                        throw new BusinessException("INVALID_DATE_RANGE",
                                        "Ngày kết thúc không thể trước ngày bắt đầu.");
                }
                if (request.getStartDate().isBefore(LocalDate.now())) {
                        throw new BusinessException("INVALID_START_DATE",
                                        "Ngày bắt đầu không thể ở quá khứ.");
                }

                LeaveType type = LeaveType.valueOf(request.getLeaveType());

                // Create a temporary leave object to calculate total days
                Leave leave = Leave.builder()
                                .employee(employee)
                                .leaveType(type)
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .reason(request.getReason())
                                .build();
                leave.calculateTotalDays();

                // Validate sufficient leave balance (FR-LEAVE-003)
                if (leave.getTotalDays() > 0 && !leaveBalanceService.hasSufficientBalance(
                                employee.getId(), type, leave.getTotalDays())) {
                        throw new BusinessException("INSUFFICIENT_BALANCE",
                                        "Bạn không đủ số dư phép cho loại nghỉ này. Cần: " + leave.getTotalDays()
                                                        + " ngày.");
                }

                // Wire the active LEAVE workflow template → sets level/status fields
                try {
                        WorkflowTemplate template = workflowEngineService.getActiveTemplate(WorkflowType.LEAVE);
                        // LeaveApprovalServiceImpl exposes this helper for initialisation
                        ((LeaveApprovalServiceImpl) leaveApprovalService).initialiseApprovalLevels(leave, template);
                } catch (BusinessException ex) {
                        // No active template configured: fall back to single-level PENDING_LEVEL_1
                        log.warn("No active LEAVE workflow template found; defaulting to 1-level approval. {}",
                                        ex.getMessage());
                        leave.setStatus(LeaveStatus.PENDING_LEVEL_1);
                        leave.setCurrentApprovalLevel(1);
                        leave.setMaxApprovalLevel(1);
                }

                Leave saved = leaveRepository.save(leave);
                log.info("User [{}] created leave request [{}] status={}", principal.getUsername(), saved.getId(),
                                saved.getStatus());
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
                        leaves = leaveRepository.findByReportingManagerUserId(principal.getUserId(), pageable);
                } else {
                        Employee self = employeeRepository.findByUserId(principal.getUserId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Employee record không tồn tại cho userId: "
                                                                        + principal.getUserId()));
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
         * Delegates approval/rejection actions to the multi-level
         * {@link LeaveApprovalService}.
         * Kept for backward API compatibility — controller can also call
         * LeaveApprovalService directly.
         */
        @Override
        public LeaveResponse approveLeave(Long id, ApproveLeaveRequest legacyRequest) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                LeaveApprovalRequest req = new LeaveApprovalRequest();
                // Map legacy "APPROVED"/"REJECTED" string to enum action
                String statusStr = legacyRequest.getStatus().toUpperCase().trim();
                req.setAction(switch (statusStr) {
                        case "APPROVED" -> com.company.ems.backend.leave.enums.LeaveApprovalAction.APPROVE;
                        case "REJECTED" -> com.company.ems.backend.leave.enums.LeaveApprovalAction.REJECT;
                        default -> throw new BusinessException("INVALID_STATUS",
                                        "Trạng thái không hợp lệ: '" + legacyRequest.getStatus()
                                                        + "'. Chỉ chấp nhận APPROVED hoặc REJECTED.");
                });
                req.setComments(legacyRequest.getNotes());
                return leaveApprovalService.processApproval(id, principal.getUserId(), req);
        }

        @Override
        public void cancelLeave(Long id) {
                CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

                Leave leave = leaveRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));

                // Ownership check: only the owner can cancel
                if (leave.getEmployee().getUser() == null
                                || !leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
                        log.warn("User [{}] attempted to cancel leave [{}] belonging to another employee",
                                        principal.getUsername(), id);
                        throw new ForbiddenException();
                }

                if (!leave.isPending()) {
                        throw new BusinessException("LEAVE_CANNOT_CANCEL",
                                        "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt. Trạng thái hiện tại: "
                                                        + leave.getStatus());
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
                                .employeeName(leave.getEmployee() != null
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
                                .currentApprovalLevel(leave.getCurrentApprovalLevel())
                                .maxApprovalLevel(leave.getMaxApprovalLevel())
                                .longLeaveHrRequired(leave.getLongLeaveHrRequired())
                                .build();
        }
}