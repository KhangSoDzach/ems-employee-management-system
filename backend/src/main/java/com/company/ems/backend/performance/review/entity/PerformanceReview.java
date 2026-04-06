package com.company.ems.backend.performance.review.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.performance.review.enums.ReviewStatus;
import com.company.ems.backend.performance.review.enums.ReviewType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "performance_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_review_period",
                columnNames = {"reviewer_id", "reviewee_id", "review_period"}
        ),
        indexes = {
                @Index(name = "idx_pr_reviewee", columnList = "reviewee_id, is_deleted"),
                @Index(name = "idx_pr_reviewer", columnList = "reviewer_id, is_deleted"),
                @Index(name = "idx_pr_period",   columnList = "review_period, is_deleted")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PerformanceReview extends BaseEntity {

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "reviewee_id", nullable = false)
    private Long revieweeId;

    @Column(name = "reviewer_username", nullable = false, length = 100)
    private String reviewerUsername;

    @Column(name = "reviewee_username", nullable = false, length = 100)
    private String revieweeUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false, length = 20)
    private ReviewType reviewType;

    @Column(name = "review_period", nullable = false, length = 20)
    private String reviewPeriod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.SUBMITTED;

    @Column(name = "expertise_score", nullable = false)
    @Builder.Default
    private Integer expertiseScore = 0;

    @Column(name = "communication_score", nullable = false)
    @Builder.Default
    private Integer communicationScore = 0;

    @Column(name = "attitude_score", nullable = false)
    @Builder.Default
    private Integer attitudeScore = 0;

    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    @Column(columnDefinition = "TEXT")
    private String comment;
    public void recalculate() {
        this.totalScore = Math.round(
                (expertiseScore + communicationScore + attitudeScore) / 3.0f
        );
    }
}