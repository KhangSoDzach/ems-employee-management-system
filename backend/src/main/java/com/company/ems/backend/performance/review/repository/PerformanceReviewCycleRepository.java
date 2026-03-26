package com.company.ems.backend.performance.review.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.ems.backend.performance.review.entity.PerformanceReviewCycle;
import com.company.ems.backend.performance.review.enums.ReviewCycleStatus;

public interface PerformanceReviewCycleRepository extends JpaRepository<PerformanceReviewCycle, Long> {

    @Query("""
            SELECT c
            FROM PerformanceReviewCycle c
            WHERE c.managerId = :managerId
              AND c.reviewPeriod = :reviewPeriod
              AND c.status = :status
              AND (c.isDeleted IS NULL OR c.isDeleted = false)
              AND c.startAt <= :now
              AND c.endAt >= :now
            ORDER BY c.createdAt DESC
            """)
    Optional<PerformanceReviewCycle> findActiveCycleByManagerAndPeriod(
            @Param("managerId") Long managerId,
            @Param("reviewPeriod") String reviewPeriod,
            @Param("status") ReviewCycleStatus status,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT c
            FROM PerformanceReviewCycle c
            WHERE c.managerId = :managerId
              AND c.status = :status
              AND (c.isDeleted IS NULL OR c.isDeleted = false)
              AND c.startAt <= :now
              AND c.endAt >= :now
            ORDER BY c.createdAt DESC
            """)
    Optional<PerformanceReviewCycle> findActiveCycleByManager(
            @Param("managerId") Long managerId,
            @Param("status") ReviewCycleStatus status,
            @Param("now") LocalDateTime now);
}
