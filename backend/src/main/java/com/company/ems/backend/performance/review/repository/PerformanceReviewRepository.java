package com.company.ems.backend.performance.review.repository;

import com.company.ems.backend.performance.review.entity.PerformanceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {
    boolean existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(
            Long reviewerId, Long revieweeId, String reviewPeriod);

    Optional<PerformanceReview> findByIdAndIsDeletedFalse(Long id);

    Page<PerformanceReview> findByRevieweeIdAndIsDeletedFalseOrderByCreatedAtDesc(
            Long revieweeId, Pageable pageable);

    @Query("""
        SELECT r FROM PerformanceReview r
        WHERE r.revieweeId = :revieweeId
          AND r.isDeleted = false
          AND (:period IS NULL OR r.reviewPeriod = :period)
        ORDER BY r.createdAt DESC
    """)
    Page<PerformanceReview> findByRevieweeIdAndOptionalPeriod(
            @Param("revieweeId") Long revieweeId,
            @Param("period") String period,
            Pageable pageable);

    Page<PerformanceReview> findByReviewerIdAndIsDeletedFalseOrderByCreatedAtDesc(
            Long reviewerId, Pageable pageable);

    @Query("""
        SELECT r FROM PerformanceReview r
        WHERE r.revieweeId IN :revieweeIds
          AND r.isDeleted = false
          AND (:period IS NULL OR r.reviewPeriod = :period)
        ORDER BY r.createdAt DESC
    """)
    Page<PerformanceReview> findByRevieweeIdsAndOptionalPeriod(
            @Param("revieweeIds") List<Long> revieweeIds,
            @Param("period") String period,
            Pageable pageable);

    @Query("""
        SELECT r FROM PerformanceReview r
        WHERE r.revieweeId = :revieweeId
          AND r.isDeleted = false
        ORDER BY r.createdAt DESC
    """)
    List<PerformanceReview> findTopByRevieweeId(@Param("revieweeId") Long revieweeId, Pageable pageable);
}