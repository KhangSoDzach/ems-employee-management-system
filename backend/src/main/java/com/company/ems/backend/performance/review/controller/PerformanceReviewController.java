package com.company.ems.backend.performance.review.controller;

import com.company.ems.backend.common.constant.AppRole;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.service.PerformanceReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/performance/reviews")
@RequiredArgsConstructor
public class PerformanceReviewController {

    private final PerformanceReviewService service;
    private final MessageService           messages;

    @PostMapping
    @PreAuthorize(AppRole.HAS_MANAGER_OR_ABOVE)
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> saveReview(
            @Valid @RequestBody PerformanceReviewDto.CreateRequest request) {

        PerformanceReviewDto.Response saved = service.saveReview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.REVIEW_CREATED), saved));
    }

    @GetMapping("/{id}")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> getReview(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success(messages.get(MessageCode.REVIEW_DETAIL), service.getReview(id)));
    }

    @GetMapping
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PageResponse<PerformanceReviewDto.Response>>> listReviews(
            @RequestParam(required = false) Long   revieweeId,
            @RequestParam(required = false) String period,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(messages.get(MessageCode.REVIEW_LIST),
                        service.listReviews(revieweeId, period, page, size)));
    }

    @GetMapping("/latest/{employeeId}")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> getLatest(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                ApiResponse.success(service.getLatestForEmployee(employeeId)));
    }
}