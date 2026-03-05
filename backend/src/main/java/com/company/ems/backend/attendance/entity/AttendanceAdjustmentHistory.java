package com.company.ems.backend.attendance.entity;

import com.company.ems.backend.attendance.enums.AdjustmentAction;
import com.company.ems.backend.attendance.enums.AdjustmentRequestStatus;
import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Immutable audit trail record for every state change in an
 * {@link AttendanceAdjustmentRequest}.
 *
 * <p>One history entry is created for each action:
 * SUBMITTED, RESUBMITTED, APPROVED, REJECTED, RETURNED_TO_EMPLOYEE,
 * APPLIED_TO_ATTENDANCE.
 *
 * <p>Records are never updated or soft-deleted — they form an append-only log
 * for compliance and audit purposes.
 */
@Entity
@Table(name = "attendance_adjustment_histories", indexes = {
        @Index(name = "idx_adj_hist_request",   columnList = "adjustment_request_id"),
        @Index(name = "idx_adj_hist_action_by", columnList = "action_by_user_id"),
        @Index(name = "idx_adj_hist_action_at", columnList = "action_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAdjustmentHistory extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adjustment_request_id", nullable = false)
    private AttendanceAdjustmentRequest adjustmentRequest;

    /**
     * The user who performed this action.
     * {@code null} for system-triggered actions (e.g. APPLIED_TO_ATTENDANCE).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_by_user_id")
    private User actionBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AdjustmentAction action;

    /** The zero-based workflow level at which this action was performed. 1-based. */
    @Column
    private Integer levelActedOn;

    /** Free-text comment / reason provided by the actor (required for REJECTED / RETURNED). */
    @Column(length = 2000)
    private String comment;

    /** Timestamp when this action was performed. */
    @NotNull
    @Column(nullable = false)
    private LocalDateTime actionAt;

    // ─── Status snapshot ──────────────────────────────────────────────────────

    /** Status of the request immediately before this action. */
    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private AdjustmentRequestStatus statusBefore;

    /** Status of the request immediately after this action. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AdjustmentRequestStatus statusAfter;

    // ─── Factory helper ───────────────────────────────────────────────────────

    /**
     * Convenience factory that records the current timestamp.
     */
    public static AttendanceAdjustmentHistory of(
            AttendanceAdjustmentRequest request,
            User actor,
            AdjustmentAction action,
            Integer levelActedOn,
            String comment,
            AdjustmentRequestStatus statusBefore,
            AdjustmentRequestStatus statusAfter) {

        return AttendanceAdjustmentHistory.builder()
                .adjustmentRequest(request)
                .actionBy(actor)
                .action(action)
                .levelActedOn(levelActedOn)
                .comment(comment)
                .actionAt(LocalDateTime.now())
                .statusBefore(statusBefore)
                .statusAfter(statusAfter)
                .build();
    }
}
