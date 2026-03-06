package com.company.ems.backend.leave.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.leave.dto.LeaveApprovalHistoryResponse;
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.entity.LeaveApprovalHistory;
import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.repository.LeaveApprovalHistoryRepository;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.enums.AssigneeType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implements the multi-level leave approval state machine.
 *
 * <p>
 * Long-leave rule (FR configurable):
 * If {@code leave.totalDays >= longLeaveThresholdDays} AND the last level of
 * the
 * workflow template is not already {@code ROLE_HR}, a synthetic HR level is
 * auto-injected at runtime (stored in {@code long_leave_hr_required = true}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LeaveApprovalServiceImpl implements LeaveApprovalService {

    /**
     * Role name that the extra HR level will be assigned to. Externalized — no
     * hardcoding.
     */
    @Value("${app.workflow.leave.long-leave-extra-level-role:ROLE_HR}")
    private String longLeaveExtraLevelRole;

    /** Threshold (inclusive) at which the long-leave HR level is auto-added. */
    @Value("${app.workflow.leave.long-leave-threshold-days:5}")
    private int longLeaveThresholdDays;

    private final LeaveRepository leaveRepository;
    private final LeaveApprovalHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final WorkflowEngineService workflowEngineService;

    // ─── Public API ───────────────────────────────────────────────────────────

    @Override
    public LeaveResponse processApproval(Long leaveId, Long approverId,
            LeaveApprovalRequest request) {
        Leave leave = findLeave(leaveId);
        User approver = findUser(approverId);

        // 1. Guard: leave must be in a pending state
        if (!leave.isPending()) {
            throw new BusinessException("LEAVE_NOT_PENDING",
                    "Only pending leave requests can be actioned. Current status: " + leave.getStatus());
        }

        // 2. Guard: approver must not be the requestor
        if (leave.getEmployee().getUser() != null
                && leave.getEmployee().getUser().getId().equals(approverId)) {
            throw new ForbiddenException("Bạn không thể tự phê duyệt yêu cầu nghỉ phép của chính mình.");
        }

        // 3. Verify approver is entitled to act at the current level
        assertApproverIsAuthorised(leave, approverId);

        LeaveStatus statusBefore = leave.getStatus();

        // 4. Dispatch based on action
        switch (request.getAction()) {
            case APPROVE -> handleApprove(leave, approver, request.getComments());
            case REJECT -> handleReject(leave, approver, request.getComments());
            case SEND_BACK -> handleSendBack(leave, approver, request.getComments());
        }

        // 5. Persist history record
        historyRepository.save(LeaveApprovalHistory.of(
                leave.getId(),
                approverId,
                approver.getUsername(),
                leave.getCurrentApprovalLevel(),
                request.getAction(),
                request.getComments(),
                statusBefore,
                leave.getStatus()));

        Leave saved = leaveRepository.save(leave);
        log.info("Leave [{}] processed by user [{}]: action={}, status={} → {}",
                leaveId, approver.getUsername(), request.getAction(), statusBefore, saved.getStatus());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveApprovalHistoryResponse> getHistory(Long leaveId) {
        // Verify leave exists
        if (!leaveRepository.existsById(leaveId)) {
            throw new ResourceNotFoundException("Leave", "id", leaveId);
        }
        return historyRepository.findByLeaveIdOrderByActionAtAsc(leaveId)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    // ─── Static initialisation helper (called from LeaveServiceImpl) ──────────

    /**
     * Calculates and sets the max approval level for a newly created leave request.
     * Applies the long-leave HR rule when applicable.
     *
     * @param leave    the unsaved leave entity (already has totalDays set)
     * @param template the active workflow template for LEAVE
     */
    public void initialiseApprovalLevels(Leave leave,
            com.company.ems.backend.workflow.entity.WorkflowTemplate template) {
        List<WorkflowLevel> levels = workflowEngineService.getLevels(template);
        int configuredMax = levels.size();

        boolean longLeaveRule = leave.getTotalDays() != null
                && leave.getTotalDays() >= longLeaveThresholdDays
                && !lastLevelIsHr(levels);

        leave.setWorkflowTemplateId(template.getId());
        leave.setCurrentApprovalLevel(1);
        leave.setMaxApprovalLevel(longLeaveRule ? configuredMax + 1 : configuredMax);
        leave.setLongLeaveHrRequired(longLeaveRule);
        leave.setStatus(LeaveStatus.PENDING_LEVEL_1);

        if (longLeaveRule) {
            log.info("Long-leave rule applied for leave [totalDays={}]: extra {} level added.",
                    leave.getTotalDays(), longLeaveExtraLevelRole);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void handleApprove(Leave leave, User approver, String comments) {
        int current = leave.getCurrentApprovalLevel();
        int max = leave.getMaxApprovalLevel();

        if (current < max) {
            // Advance to next level
            leave.advanceToNextLevel();
            log.info("Leave [{}] advanced to level {}/{}", leave.getId(), current + 1, max);
        } else {
            // Final level — fully approve and deduct balance
            leave.setStatus(LeaveStatus.APPROVED);
            leave.approve(approver, comments);
            deductLeaveBalance(leave);
            log.info("Leave [{}] FULLY APPROVED at level {}", leave.getId(), current);
        }
    }

    private void handleReject(Leave leave, User approver, String comments) {
        leave.reject(approver, comments);
    }

    private void handleSendBack(Leave leave, User approver, String comments) {
        leave.setStatus(LeaveStatus.RETURNED_TO_EMPLOYEE);
        // Reset to level 1 so the employee can resubmit and go through the chain again
        leave.setCurrentApprovalLevel(1);
        log.info("Leave [{}] RETURNED to employee by user [{}]", leave.getId(), approver.getUsername());
    }

    /**
     * Checks that the acting user is authorised to act at the leave's current
     * level.
     * Authorization is based on:
     * - Level N configured in the WorkflowTemplate (ROLE or specific USER)
     * - Level == maxApprovalLevel AND longLeaveHrRequired → must have
     * longLeaveExtraLevelRole
     */
    private void assertApproverIsAuthorised(Leave leave, Long approverId) {
        int currentLevel = leave.getCurrentApprovalLevel();
        int maxLevel = leave.getMaxApprovalLevel();
        boolean isExtraHrLevel = Boolean.TRUE.equals(leave.getLongLeaveHrRequired())
                && currentLevel == maxLevel;

        if (isExtraHrLevel) {
            // Extra HR level: approver must have the long-leave extra level role
            boolean hasRole = userRepository.findById(approverId)
                    .map(u -> u.getRoles().stream()
                            .anyMatch(r -> r.getName().equals(longLeaveExtraLevelRole)))
                    .orElse(false);
            if (!hasRole) {
                throw new ForbiddenException(
                        "Cấp duyệt " + currentLevel + " yêu cầu vai trò " + longLeaveExtraLevelRole + ".");
            }
            return;
        }

        // Normal template level: resolve approver IDs from the workflow engine
        var template = workflowEngineService.getActiveTemplate(
                com.company.ems.backend.workflow.enums.WorkflowType.LEAVE);
        Optional<WorkflowLevel> levelOpt = workflowEngineService.getLevel(template, currentLevel);

        if (levelOpt.isEmpty()) {
            throw new BusinessException("WORKFLOW_LEVEL_NOT_FOUND",
                    "Không tìm thấy cấu hình cấp duyệt " + currentLevel + " trong workflow template.");
        }

        List<Long> authorisedIds = workflowEngineService.resolveApproverUserIds(levelOpt.get());
        if (!authorisedIds.isEmpty() && !authorisedIds.contains(approverId)) {
            throw new ForbiddenException(
                    "Bạn không có quyền phê duyệt ở cấp " + currentLevel + ".");
        }
    }

    private void deductLeaveBalance(Leave leave) {
        if (leave.getTotalDays() == null || leave.getTotalDays() <= 0)
            return;
        try {
            leaveBalanceService.deductBalance(
                    leave.getEmployee().getId(),
                    leave.getLeaveType(),
                    leave.getTotalDays());
        } catch (Exception ex) {
            // Log but do not fail the approval — balance adjustment can be done manually
            log.warn("Could not deduct leave balance for leave [{}]: {}", leave.getId(), ex.getMessage());
        }
    }

    private boolean lastLevelIsHr(List<WorkflowLevel> levels) {
        if (levels == null || levels.isEmpty())
            return false;
        WorkflowLevel last = levels.get(levels.size() - 1);
        return last.getAssigneeType() == AssigneeType.ROLE
                && longLeaveExtraLevelRole.equals(last.getAssigneeRole());
    }

    private Leave findLeave(Long id) {
        return leaveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private LeaveResponse mapToResponse(Leave leave) {
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
                .currentApprovalLevel(leave.getCurrentApprovalLevel())
                .maxApprovalLevel(leave.getMaxApprovalLevel())
                .longLeaveHrRequired(Boolean.TRUE.equals(leave.getLongLeaveHrRequired()))
                .createdAt(leave.getCreatedAt())
                .build();
    }

    private LeaveApprovalHistoryResponse toHistoryResponse(LeaveApprovalHistory h) {
        return LeaveApprovalHistoryResponse.builder()
                .id(h.getId())
                .leaveId(h.getLeaveId())
                .approvalLevel(h.getApprovalLevel())
                .approverUserId(h.getApproverUserId())
                .approverName(h.getApproverName())
                .action(h.getAction() != null ? h.getAction().name() : null)
                .comments(h.getComments())
                .actionAt(h.getActionAt())
                .statusBefore(h.getStatusBefore() != null ? h.getStatusBefore().name() : null)
                .statusAfter(h.getStatusAfter() != null ? h.getStatusAfter().name() : null)
                .build();
    }
}
