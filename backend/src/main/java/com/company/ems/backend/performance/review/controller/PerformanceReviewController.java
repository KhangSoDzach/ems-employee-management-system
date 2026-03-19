package com.company.ems.backend.performance.review.controller;

import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.service.PerformanceReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/performance/reviews")
@RequiredArgsConstructor
@Tag(name = "Performance Review", description = "Endpoints for managing employee performance evaluations")
public class PerformanceReviewController {

    private final PerformanceReviewService service;
    private final MessageService           messages;

    @PostMapping
    @PreAuthorize(RoleAuthorization.HAS_MANAGER_OR_ABOVE)
    @Operation(summary = "Save a new review", description = "Submits a performance evaluation for an employee. Managers can submit reviews for their team members.")
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> saveReview(
            @Valid @RequestBody PerformanceReviewDto.CreateRequest request) {

        PerformanceReviewDto.Response saved = service.saveReview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.REVIEW_CREATED), saved));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get review by ID", description = "Retrieves a specific performance review record.")
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> getReview(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success(messages.get(MessageCode.REVIEW_DETAIL), service.getReview(id)));
    }

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "List reviews", description = "Returns a paginated list of performance reviews. Can be filtered by reviewee and period.")
    public ResponseEntity<ApiResponse<PageResponse<PerformanceReviewDto.Response>>> listReviews(
            @Parameter(description = "ID of the employee being reviewed") @RequestParam(required = false) Long   revieweeId,
            @Parameter(description = "Review period (e.g., 2026-Q1)") @RequestParam(required = false) String period,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(messages.get(MessageCode.REVIEW_LIST),
                        service.listReviews(revieweeId, period, page, size)));
    }

    @GetMapping("/latest/{employeeId}")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get latest review", description = "Retrieves the most recent performance review for a given employee.")
    public ResponseEntity<ApiResponse<PerformanceReviewDto.Response>> getLatest(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                ApiResponse.success(service.getLatestForEmployee(employeeId)));
    }
}