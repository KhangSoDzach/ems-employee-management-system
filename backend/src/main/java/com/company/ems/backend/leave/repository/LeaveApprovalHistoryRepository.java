package com.company.ems.backend.leave.repository;

import com.company.ems.backend.leave.entity.LeaveApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for leave approval audit history.
 * All queries are read-only in production — history is append-only.
 */
@Repository
public interface LeaveApprovalHistoryRepository extends JpaRepository<LeaveApprovalHistory, Long> {

    /**
     * Returns the full approval history for a leave request,
     * ordered chronologically (FR-WORKFLOW-007).
     */
    List<LeaveApprovalHistory> findByLeaveIdOrderByActionAtAsc(Long leaveId);
}
