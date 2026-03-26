package com.company.ems.backend.performance.review.entity;

import java.time.LocalDateTime;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.performance.review.enums.ReviewCycleStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "performance_review_cycles", indexes = {
        @Index(name = "idx_prc_manager_period", columnList = "manager_id, review_period, status, is_deleted"),
        @Index(name = "idx_prc_window", columnList = "manager_id, start_at, end_at, status, is_deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReviewCycle extends BaseEntity {

    @Column(name = "manager_id", nullable = false)
    private Long managerId;

    @Column(name = "review_period", nullable = false, length = 20)
    private String reviewPeriod;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReviewCycleStatus status = ReviewCycleStatus.OPEN;
}
