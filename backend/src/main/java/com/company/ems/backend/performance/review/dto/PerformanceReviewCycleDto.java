package com.company.ems.backend.performance.review.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.performance.review.enums.ReviewCycleStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Data;

public class PerformanceReviewCycleDto {
    private PerformanceReviewCycleDto() {
    }

    @Data
    public static class OpenRequest {
        @NotBlank(message = "reviewPeriod không được để trống")
        @Pattern(regexp = "^\\d{4}-(Q[1-4]|H[12]|ANNUAL)$", message = "reviewPeriod phải theo định dạng: 2026-Q1, 2026-H1, 2026-ANNUAL")
        private String reviewPeriod;
    }

    @Data
    @Builder
    public static class Response {
        private Long id;
        private Long managerId;
        private String reviewPeriod;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private ReviewCycleStatus status;
        private int notifiedMemberCount;
    }
}
