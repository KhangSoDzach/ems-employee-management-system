package com.company.ems.backend.attendance.repository;

import com.company.ems.backend.attendance.entity.AttendanceAdjustmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for {@link AttendanceAdjustmentHistory}.
 *
 * <p>History records are immutable — no update or delete operations should be performed.
 * Queries are read-only by convention.
 */
@Repository
public interface AttendanceAdjustmentHistoryRepository
        extends JpaRepository<AttendanceAdjustmentHistory, Long> {

    /**
     * Returns the complete audit timeline for a request, ordered chronologically.
     * Used to render the approval timeline on the detail/modal page.
     */
    List<AttendanceAdjustmentHistory> findByAdjustmentRequestIdOrderByActionAtAsc(Long adjustmentRequestId);
}
