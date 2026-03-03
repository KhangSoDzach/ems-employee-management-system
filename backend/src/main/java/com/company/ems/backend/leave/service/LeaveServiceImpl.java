package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;

import com.company.ems.backend.leave.enums.LeaveType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.user.repository.UserRepository;

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

    @Override
    public LeaveResponse createLeaveRequest(LeaveRequest request) {
        CustomUserPrincipal principal = getCurrentPrincipal();

        Employee employee = employeeRepository.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee record không tồn tại cho userId: " + principal.getUserId()));

        // Business rule: validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("INVALID_DATE_RANGE", "Ngày kết thúc không thể trước ngày bắt đầu.");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new BusinessException("INVALID_START_DATE", "Ngày bắt đầu không thể ở quá khứ.");
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
        CustomUserPrincipal principal = getCurrentPrincipal();
        PageRequest pageable = PageRequest.of(page, size);
        Page<Leave> leaves;

        if (principal.hasDataScope(DataScope.ALL)) {
            leaves = leaveRepository.findAll(pageable);
        } else if (principal.hasDataScope(DataScope.TEAM)) {
            leaves = leaveRepository.findByReportingManagerUserId(principal.getUserId(), pageable);
        } else {
            // SELF: chỉ leave của chính mình
            Employee self = employeeRepository.findByUserId(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Employee record không tồn tại cho userId: " + principal.getUserId()));
            leaves = leaveRepository.findByEmployeeId(self.getId(), pageable);
        }

        List<LeaveResponse> content = leaves.getContent().stream().map(this::mapToResponse).toList();
        return PageResponse.<LeaveResponse>builder()
                .content(content).page(page).size(size)
                .totalElements(leaves.getTotalElements()).totalPages(leaves.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveResponse getLeaveById(Long id) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));
        return mapToResponse(leave);
    }

    @Override
    public LeaveResponse approveLeave(Long id, ApproveLeaveRequest request) {
        CustomUserPrincipal principal = getCurrentPrincipal();

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));

        // Business rule 1: chỉ PENDING mới xử lý được
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException("LEAVE_NOT_PENDING",
                    "Chỉ có thể xử lý yêu cầu đang ở trạng thái chờ duyệt. " +
                            "Trạng thái hiện tại: " + leave.getStatus());
        }

        // Business rule 2: không tự approve leave của mình
        if (leave.getEmployee().getUser() != null
                && leave.getEmployee().getUser().getId().equals(principal.getUserId())) {
            throw new ForbiddenException("Không thể tự phê duyệt yêu cầu nghỉ phép của chính mình.");
        }

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
                    "Trạng thái không hợp lệ: '" + request.getStatus() + "'. Chỉ chấp nhận APPROVED hoặc REJECTED.");
        }

        return mapToResponse(leaveRepository.save(leave));
    }

    @Override
    public void cancelLeave(Long id) {
        CustomUserPrincipal principal = getCurrentPrincipal();

        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));

        // Business rule: chỉ hủy khi còn PENDING
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException("LEAVE_CANNOT_CANCEL",
                    "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt. " +
                            "Trạng thái hiện tại: " + leave.getStatus());
        }

        leave.cancel();
        leaveRepository.save(leave);
        log.info("User [{}] cancelled leave [{}]", principal.getUsername(), id);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private CustomUserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserPrincipal) auth.getPrincipal();
    }

    private LeaveResponse mapToResponse(Leave leave) {
        if (leave == null) return null;
        return LeaveResponse.builder()
                .id(leave.getId())
                .employeeId(leave.getEmployee() != null ? leave.getEmployee().getId() : null)
                .employeeName(leave.getEmployee() != null
                        ? leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName()
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