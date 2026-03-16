package com.company.ems.backend.performance.review.mapper;

import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.entity.PerformanceReview;
import org.springframework.stereotype.Component;

@Component
public class PerformanceReviewMapper {

    public PerformanceReviewDto.Response toResponse(PerformanceReview r) {
        return PerformanceReviewDto.Response.builder()
                .id(r.getId())
                .reviewerId(r.getReviewerId())
                .reviewerUsername(r.getReviewerUsername())
                .revieweeId(r.getRevieweeId())
                .revieweeUsername(r.getRevieweeUsername())
                .reviewType(r.getReviewType())
                .reviewPeriod(r.getReviewPeriod())
                .status(r.getStatus())
                .expertiseScore(r.getExpertiseScore())
                .communicationScore(r.getCommunicationScore())
                .attitudeScore(r.getAttitudeScore())
                .totalScore(r.getTotalScore())
                .rank(resolveRank(r.getTotalScore()))
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    public static String resolveRank(int score) {
        if (score >= 90) return "Xuất sắc - A";
        if (score >= 80) return "Tốt - B";
        if (score >= 70) return "Khá - C";
        if (score >= 60) return "Trung bình - D";
        return "Cần cải thiện - E";
    }
}