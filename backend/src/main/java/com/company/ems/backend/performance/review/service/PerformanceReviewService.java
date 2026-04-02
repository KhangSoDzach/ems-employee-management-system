package com.company.ems.backend.performance.review.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.performance.review.dto.PerformanceReviewCycleDto;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;

public interface PerformanceReviewService {
    PerformanceReviewDto.Response saveReview(PerformanceReviewDto.CreateRequest request);
    PerformanceReviewDto.Response getReview(Long id);
    PageResponse<PerformanceReviewDto.Response> listReviews(
            Long revieweeId, String period, int page, int size);
    PerformanceReviewDto.Response getLatestForEmployee(Long employeeId);
    PerformanceReviewCycleDto.Response openReviewCycle(PerformanceReviewCycleDto.OpenRequest request);
    PerformanceReviewCycleDto.Response getMyActiveCycle();
    PerformanceReviewDto.AggregateResponse getAggregate(Long employeeId, String period);
}