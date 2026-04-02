package com.company.ems.backend.performance.review.dto;

@lombok.Data
@lombok.Builder
public class AggregateResponse {
    private Long revieweeId;
    private String revieweeName;
    private String reviewPeriod;
    private PerformanceReviewDto.ReviewBreakdown managerReview;
    private PerformanceReviewDto.ReviewBreakdown selfReview;
    private PerformanceReviewDto.ReviewBreakdown upwardReview;
    private java.util.List<PerformanceReviewDto.ReviewBreakdown> peerReviews;
    private Double overallScore;
    private String overallRank;
    private boolean hasManagerReview;
    private boolean hasSelfReview;
    private boolean hasUpwardReview;
    private int peerReviewCount;
    private int totalReviewers;
}
