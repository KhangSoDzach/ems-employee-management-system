package com.company.ems.backend.performance.review.dto;

import com.company.ems.backend.performance.review.enums.ReviewStatus;
import com.company.ems.backend.performance.review.enums.ReviewType;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class PerformanceReviewDto {
    private PerformanceReviewDto() {
    }

    @Data
    public static class CreateRequest {

        @NotNull(message = "revieweeId không được để trống")
        private Long revieweeId;

        @NotNull(message = "reviewType không được để trống")
        private ReviewType reviewType;

        @NotBlank(message = "reviewPeriod không được để trống")
        @Pattern(regexp = "^\\d{4}-(Q[1-4]|H[12]|ANNUAL)$",
                message = "reviewPeriod phải theo định dạng: 2026-Q1, 2026-H1, 2026-ANNUAL")
        private String reviewPeriod;
        @NotNull(message = "scores không được để trống")
        private ScoresRequest scores;

        private String comment;
    }

    @Data
    public static class ScoresRequest {
        @Min(value = 0, message = "Điểm chuyên môn phải từ 0 đến 100")
        @Max(value = 100, message = "Điểm chuyên môn phải từ 0 đến 100")
        @NotNull(message = "expertiseScore không được để trống")
        private Integer expertise;

        @Min(value = 0, message = "Điểm giao tiếp phải từ 0 đến 100")
        @Max(value = 100, message = "Điểm giao tiếp phải từ 0 đến 100")
        @NotNull(message = "communicationScore không được để trống")
        private Integer communication;

        @Min(value = 0, message = "Điểm thái độ phải từ 0 đến 100")
        @Max(value = 100, message = "Điểm thái độ phải từ 0 đến 100")
        @NotNull(message = "attitudeScore không được để trống")
        private Integer attitude;
    }
    @Data
    @Builder
    public static class Response {
        private Long id;
        private Long   reviewerId;
        private String reviewerUsername;
        private Long   revieweeId;
        private String revieweeUsername;
        private ReviewType   reviewType;
        private String       reviewPeriod;
        private ReviewStatus status;
        private Integer expertiseScore;
        private Integer communicationScore;
        private Integer attitudeScore;
        private Integer totalScore;
        private String  rank;
        private String comment;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    public static class Summary {
        private Long    revieweeId;
        private String  revieweeUsername;
        private long    totalReviews;
        private double  avgExpertise;
        private double  avgCommunication;
        private double  avgAttitude;
        private double  avgTotal;
        private String  latestPeriod;
    }

    @Data
    @Builder
    public static class ReviewBreakdown {
        private Integer expertiseScore;
        private Integer communicationScore;
        private Integer attitudeScore;
        private Integer totalScore;
        private String  rank;
        private String  comment;
        private String  reviewerName;
    }

    @Data
    @Builder
    public static class AggregateResponse {
        private Long   revieweeId;
        private String revieweeName;
        private String reviewPeriod;
        private ReviewBreakdown managerReview;
        private ReviewBreakdown selfReview;
        private ReviewBreakdown upwardReview;
        private java.util.List<ReviewBreakdown> peerReviews;
        private Double  overallScore;
        private String  overallRank;
        private boolean hasManagerReview;
        private boolean hasSelfReview;
        private boolean hasUpwardReview;
        private int     peerReviewCount;
        private int     totalReviewers;
    }
}
