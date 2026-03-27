package com.company.ems.backend.attendance.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.attendance.entity.AttendanceAdjustmentRequest;
import com.company.ems.backend.attendance.enums.AdjustmentAction;
import com.company.ems.backend.attendance.enums.AdjustmentRequestStatus;

/**
 * Repository for {@link AttendanceAdjustmentRequest}.
 */
@Repository
public interface AttendanceAdjustmentRequestRepository
        extends JpaRepository<AttendanceAdjustmentRequest, Long> {

    // ─── Employee-facing queries ──────────────────────────────────────────────

    /**
     * Paginated list of all non-deleted requests submitted by an employee,
     * ordered newest first.
     */
    @Query("""
            SELECT r FROM AttendanceAdjustmentRequest r
            WHERE r.employee.id = :employeeId
            ORDER BY r.createdAt DESC
            """)
    Page<AttendanceAdjustmentRequest> findByEmployeeId(
            @Param("employeeId") Long employeeId, Pageable pageable);

    // ─── Manager / Approver-facing queries ────────────────────────────────────

    /**
     * Returns all requests that are currently pending at {@code level} and whose
     * workflow template assigns a given role name to that level.
     *
     * <p>Used by managers/HR to build their approval inbox.
     */
    @Query("""
            SELECT r FROM AttendanceAdjustmentRequest r
            JOIN WorkflowLevel wl
              ON wl.template.id = r.workflowTemplateId
             AND wl.levelNumber  = r.currentApprovalLevel
             AND wl.isDeleted    = false
            WHERE r.status IN :pendingStatuses
              AND wl.assigneeType = 'ROLE'
              AND wl.assigneeRole = :roleName
              AND r.employee.id  <> :excludeEmployeeId
            ORDER BY r.createdAt ASC
            """)
    Page<AttendanceAdjustmentRequest> findPendingByRoleApprover(
            @Param("pendingStatuses")    List<AdjustmentRequestStatus> pendingStatuses,
            @Param("roleName")           String roleName,
            @Param("excludeEmployeeId")  Long excludeEmployeeId,
            Pageable pageable);

    /**
     * Returns approver inbox items plus requests already processed by this approver.
     *
     * <p>Use-case: manager/HR screens need both current pending items and history
     * (approved/rejected/returned), so items do not disappear after processing.
     */
    @Query("""
                SELECT r FROM AttendanceAdjustmentRequest r
                WHERE r.employee.id <> :excludeEmployeeId
                  AND (
                          EXISTS (
                                SELECT wl.id FROM WorkflowLevel wl
                                WHERE wl.template.id  = r.workflowTemplateId
                                  AND wl.levelNumber  = r.currentApprovalLevel
                                  AND wl.isDeleted    = false
                                  AND r.status IN :pendingStatuses
                                  AND (
                                          (wl.assigneeType = 'ROLE' AND wl.assigneeRole = :roleName)
                                     OR (wl.assigneeType = 'USER' AND wl.assigneeUser.id = :approverUserId)
                                  )
                          )
                          OR EXISTS (
                                SELECT h.id FROM AttendanceAdjustmentHistory h
                                WHERE h.adjustmentRequest.id = r.id
                                  AND h.actionBy.id          = :approverUserId
                                  AND h.action IN :historyActions
                          )
                  )
                ORDER BY r.createdAt DESC
                """)
    Page<AttendanceAdjustmentRequest> findApproverInboxAndHistory(
                @Param("pendingStatuses")   List<AdjustmentRequestStatus> pendingStatuses,
                @Param("historyActions")    List<AdjustmentAction> historyActions,
                @Param("roleName")          String roleName,
                @Param("excludeEmployeeId") Long excludeEmployeeId,
                @Param("approverUserId")    Long approverUserId,
                Pageable pageable);

    /**
     * Returns all pending requests where a specific user is assigned as an approver
     * at the current level (USER-type assignee).
     */
    @Query("""
            SELECT r FROM AttendanceAdjustmentRequest r
            JOIN WorkflowLevel wl
              ON wl.template.id     = r.workflowTemplateId
             AND wl.levelNumber      = r.currentApprovalLevel
             AND wl.isDeleted        = false
            WHERE r.status IN :pendingStatuses
              AND wl.assigneeType    = 'USER'
              AND wl.assigneeUser.id = :userId
            ORDER BY r.createdAt ASC
            """)
    Page<AttendanceAdjustmentRequest> findPendingByUserApprover(
            @Param("pendingStatuses") List<AdjustmentRequestStatus> pendingStatuses,
            @Param("userId")          Long userId,
            Pageable pageable);

    // ─── Count helpers for notification badges ────────────────────────────────

    /**
     * Counts requests that require a specific role approver at the current level.
     */
    @Query("""
            SELECT COUNT(r) FROM AttendanceAdjustmentRequest r
            JOIN WorkflowLevel wl
              ON wl.template.id = r.workflowTemplateId
             AND wl.levelNumber  = r.currentApprovalLevel
             AND wl.isDeleted    = false
            WHERE r.status IN :pendingStatuses
              AND wl.assigneeType = 'ROLE'
              AND wl.assigneeRole = :roleName
            """)
    long countPendingByRoleApprover(
            @Param("pendingStatuses") List<AdjustmentRequestStatus> pendingStatuses,
            @Param("roleName")        String roleName);
}
