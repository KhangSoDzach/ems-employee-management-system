package com.company.ems.backend.leave.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import com.company.ems.backend.leave.enums.LeaveStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Immutable audit trail entry for every approval action taken on a leave
 * request.
 * Implements FR-WORKFLOW-007 requirements.
 *
 * <p>
 * Records are append-only — never update existing rows. Each state transition
 * (APPROVE / REJECT / SEND_BACK / SUBMIT) produces one new history entry.
 */
@Entity
@Table(name = "leave_approval_histories", indexes = {
        @Index(name = "idx_leave_hist_leave_id", columnList = "leave_id"),
        @Index(name = "idx_leave_hist_approver", columnList = "approver_user_id"),
        @Index(name = "idx_leave_hist_action_at", columnList = "action_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveApprovalHistory extends BaseEntity {

    /** The leave request this history entry belongs to. */
    @NotNull
    @Column(name = "leave_id", nullable = false)
    private Long leaveId;

    /**
     * User who triggered the action. NULL for system-triggered transitions
     * (e.g., data migration, auto-escalation).
     */
    @Column(name = "approver_user_id")
    private Long approverUserId;

    /** Display name of the approver (denormalized for audit readability). */
    @Column(name = "approver_name", length = 200)
    private String approverName;

    /** Approval level at which this action occurred (1-based). */
    @Min(1)
    @Column(name = "approval_level", nullable = false)
    private int approvalLevel;

    /** Action taken by the approver or system. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveApprovalAction action;

    /** Optional comment / reason provided with the action. */
    @Column(length = 2000)
    private String comments;

    /** Timestamp of the action. */
    @NotNull
    @Column(name = "action_at", nullable = false)
    private LocalDateTime actionAt;

    /**
     * Status before this action was applied. NULL for the initial SUBMIT action.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status_before", length = 40)
    private LeaveStatus statusBefore;

    /** Status after this action was applied. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status_after", nullable = false, length = 40)
    private LeaveStatus statusAfter;

    // ─── Factory helpers ──────────────────────────────────────────────────────

    /**
     * Creates a history entry for an approver action.
     */
    public static LeaveApprovalHistory of(Long leaveId,
            Long approverUserId,
            String approverName,
            int approvalLevel,
            LeaveApprovalAction action,
            String comments,
            LeaveStatus statusBefore,
            LeaveStatus statusAfter) {
        return LeaveApprovalHistory.builder()
                .leaveId(leaveId)
                .approverUserId(approverUserId)
                .approverName(approverName)
                .approvalLevel(approvalLevel)
                .action(action)
                .comments(comments)
                .actionAt(LocalDateTime.now())
                .statusBefore(statusBefore)
                .statusAfter(statusAfter)
                .build();
    }
}
