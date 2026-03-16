package com.company.ems.backend.performance.review.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.exception.AppException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.entity.PerformanceReview;
import com.company.ems.backend.performance.review.enums.ReviewType;
import com.company.ems.backend.performance.review.mapper.PerformanceReviewMapper;
import com.company.ems.backend.performance.review.repository.PerformanceReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PerformanceReviewServiceImpl implements PerformanceReviewService {

    private final PerformanceReviewRepository reviewRepo;
    private final EmployeeRepository          employeeRepo;
    private final PerformanceReviewMapper     mapper;
    private final MessageService              messages;

    @Override
    public PerformanceReviewDto.Response saveReview(PerformanceReviewDto.CreateRequest req) {
        String reviewerUsername = currentUsername();

        Long revieweeId = req.getRevieweeId();
        if (revieweeId == null) {
            throw new AppException(ErrorCode.VALID_PARAM_MISSING, "Reviewee ID is required");
        }
        Employee reviewee = employeeRepo.findById(revieweeId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        messages.get(MessageCode.REVIEW_EMPLOYEE_NOT_FOUND, revieweeId)));

        Long reviewerId = resolveReviewerId(reviewerUsername);
        String reviewerDisplayName = reviewerUsername;

        if (req.getReviewType() == ReviewType.SELF && (reviewerId == null || !reviewerId.equals(req.getRevieweeId()))) {
                throw new AppException(ErrorCode.ACCESS_DENIED,
                        messages.get(MessageCode.REVIEW_SELF_ONLY));
            }


        if (reviewRepo.existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(
                reviewerId != null ? reviewerId : 0L,
                req.getRevieweeId(),
                req.getReviewPeriod())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    messages.get(MessageCode.REVIEW_DUPLICATE, req.getReviewPeriod()));
        }

        PerformanceReviewDto.ScoresRequest scores = req.getScores();
        PerformanceReview review = PerformanceReview.builder()
                .reviewerId(reviewerId != null ? reviewerId : 0L)
                .revieweeId(req.getRevieweeId())
                .reviewerUsername(reviewerDisplayName)
                .revieweeUsername(reviewee.getFullName())
                .reviewType(req.getReviewType())
                .reviewPeriod(req.getReviewPeriod())
                .expertiseScore(scores.getExpertise())
                .communicationScore(scores.getCommunication())
                .attitudeScore(scores.getAttitude())
                .comment(req.getComment())
                .build();

        review.recalculate();
        PerformanceReview saved = reviewRepo.save(review);

        log.info("Review saved: id=[{}] reviewee=[{}] period=[{}] total=[{}] by=[{}]",
                saved.getId(), reviewee.getFullName(), req.getReviewPeriod(),
                saved.getTotalScore(), reviewerUsername);

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceReviewDto.Response getReview(Long id) {
        PerformanceReview review = reviewRepo.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        messages.get(MessageCode.REVIEW_NOT_FOUND, id)));
        return mapper.toResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PerformanceReviewDto.Response> listReviews(
            Long revieweeId, String period, int page, int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<PerformanceReview> result = reviewRepo.findByRevieweeIdAndOptionalPeriod(
                revieweeId, period, pageable);

        return PageResponse.of(result.map(mapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceReviewDto.Response getLatestForEmployee(Long employeeId) {
        List<PerformanceReview> results = reviewRepo.findTopByRevieweeId(
                employeeId,
                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));

        if (results.isEmpty()) {
            return PerformanceReviewDto.Response.builder()
                    .revieweeId(employeeId)
                    .totalScore(0)
                    .expertiseScore(0)
                    .communicationScore(0)
                    .attitudeScore(0)
                    .rank("Chưa có đánh giá")
                    .build();
        }
        return mapper.toResponse(results.get(0));
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return auth.getName();
    }

    private Long resolveReviewerId(String username) {
        return employeeRepo.findByUserUsername(username)
                .map(Employee::getId)
                .orElse(null);
    }
}