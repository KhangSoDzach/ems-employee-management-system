package com.company.ems.backend.performance.review.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.event.NotificationEvent;
import com.company.ems.backend.common.exception.AppException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.service.NotificationService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.review.dto.PerformanceReviewCycleDto;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.entity.PerformanceReview;
import com.company.ems.backend.performance.review.entity.PerformanceReviewCycle;
import com.company.ems.backend.performance.review.enums.ReviewCycleStatus;
import com.company.ems.backend.performance.review.enums.ReviewType;
import com.company.ems.backend.performance.review.mapper.PerformanceReviewMapper;
import com.company.ems.backend.performance.review.repository.PerformanceReviewCycleRepository;
import com.company.ems.backend.performance.review.repository.PerformanceReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PerformanceReviewServiceImpl implements PerformanceReviewService {

    private final PerformanceReviewRepository reviewRepo;
    private final PerformanceReviewCycleRepository cycleRepo;
    private final EmployeeRepository          employeeRepo;
    private final PerformanceReviewMapper     mapper;
    private final MessageService              messages;
    private final NotificationService         notificationService;

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public PerformanceReviewDto.Response saveReview(PerformanceReviewDto.CreateRequest req) {
        String reviewerUsername = currentUsername();

        Long revieweeId = req.getRevieweeId();
        if (revieweeId == null) {
            throw new AppException(ErrorCode.VALID_PARAM_MISSING, "Reviewee ID is required");
        }

        Employee reviewer = employeeRepo.findByUserUsername(reviewerUsername)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy hồ sơ nhân viên của người đánh giá"));

        Employee reviewee = employeeRepo.findById(revieweeId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        messages.get(MessageCode.REVIEW_EMPLOYEE_NOT_FOUND, revieweeId)));

        Long reviewerId = reviewer.getId();
        String reviewerDisplayName = reviewer.getFullName();

        Long cycleManagerId;
        ReviewType resolvedReviewType;
        if (isManagerReviewingDirectReport(reviewer, reviewee)) {
            cycleManagerId = reviewerId;
            resolvedReviewType = ReviewType.MANAGER;
        } else if (isEmployeePeerReview(reviewer, reviewee)) {
            cycleManagerId = reviewer.getReportingManager().getId();
            resolvedReviewType = ReviewType.PEER;
        } else if (isSubordinateReviewingManager(reviewer, reviewee)) {
            cycleManagerId = reviewee.getId();
            resolvedReviewType = ReviewType.UPWARD;
        } else {
            throw new AppException(ErrorCode.ACCESS_DENIED,
                    "Bạn không có quyền đánh giá nhân sự này");
        }

        LocalDateTime now = LocalDateTime.now();
        cycleRepo.findActiveCycleByManagerAndPeriod(
                        cycleManagerId,
                        req.getReviewPeriod(),
                        ReviewCycleStatus.OPEN,
                        now)
                .orElseThrow(() -> new AppException(ErrorCode.ACCESS_DENIED,
                        "Đợt đánh giá chưa mở hoặc đã hết hạn cho kỳ này"));


        if (reviewRepo.existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(
                reviewerId,
                req.getRevieweeId(),
                req.getReviewPeriod())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    messages.get(MessageCode.REVIEW_DUPLICATE, req.getReviewPeriod()));
        }

        PerformanceReviewDto.ScoresRequest scores = req.getScores();
        PerformanceReview review = PerformanceReview.builder()
            .reviewerId(reviewerId)
                .revieweeId(req.getRevieweeId())
                .reviewerUsername(reviewerDisplayName)
                .revieweeUsername(reviewee.getFullName())
                .reviewType(resolvedReviewType)
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

    @Override
    public PerformanceReviewCycleDto.Response openReviewCycle(PerformanceReviewCycleDto.OpenRequest request) {
        String username = currentUsername();
        Employee manager = employeeRepo.findByUserUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy hồ sơ nhân viên của manager"));

        LocalDateTime now = LocalDateTime.now();
        cycleRepo.findActiveCycleByManager(manager.getId(), ReviewCycleStatus.OPEN, now)
                .ifPresent(existing -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                            "Đã có đợt đánh giá đang mở đến " + existing.getEndAt().format(DISPLAY_DATE));
                });

        PerformanceReviewCycle cycle = PerformanceReviewCycle.builder()
                .managerId(manager.getId())
                .reviewPeriod(request.getReviewPeriod())
                .startAt(now)
                .endAt(now.plusDays(3))
                .status(ReviewCycleStatus.OPEN)
                .build();

        PerformanceReviewCycle savedCycle = cycleRepo.save(cycle);

        List<Employee> directReports = employeeRepo.findDirectReportsByManagerId(manager.getId());
        int notifiedCount = 0;
        String notifyMessage = String.format(
                "Quản lý đã mở đợt đánh giá %s. Hạn kết thúc: %s",
                savedCycle.getReviewPeriod(),
                savedCycle.getEndAt().format(DISPLAY_DATE));

        for (Employee report : directReports) {
            if (report.getUser() == null || report.getUser().getId() == null) {
                continue;
            }
            notificationService.send(NotificationEvent.builder()
                    .eventType("PERFORMANCE_REVIEW_CYCLE_OPENED")
                    .recipientUserId(report.getUser().getId())
                    .message(notifyMessage)
                    .referenceId(savedCycle.getId())
                    .referenceType("PERFORMANCE_REVIEW_CYCLE")
                    .build());
            notifiedCount++;
        }

        return toCycleResponse(savedCycle, notifiedCount);
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceReviewCycleDto.Response getMyActiveCycle() {
        String username = currentUsername();
        Employee me = employeeRepo.findByUserUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy hồ sơ nhân viên hiện tại"));

        LocalDateTime now = LocalDateTime.now();

        Long managerIdForCycle = me.getId();
        boolean hasDirectReports = !employeeRepo.findDirectReportsByManagerId(me.getId()).isEmpty();
        if (!hasDirectReports) {
            if (me.getReportingManager() == null) {
                return null;
            }
            managerIdForCycle = me.getReportingManager().getId();
        }

        return cycleRepo.findActiveCycleByManager(managerIdForCycle, ReviewCycleStatus.OPEN, now)
                .map(cycle -> toCycleResponse(cycle, 0))
                .orElse(null);
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return auth.getName();
    }

    private boolean isManagerReviewingDirectReport(Employee reviewer, Employee reviewee) {
        return reviewee.getReportingManager() != null
                && reviewee.getReportingManager().getId() != null
                && reviewee.getReportingManager().getId().equals(reviewer.getId());
    }

    private boolean isEmployeePeerReview(Employee reviewer, Employee reviewee) {
        if (reviewer.getId().equals(reviewee.getId())) {
            return false;
        }
        if (reviewer.getReportingManager() == null || reviewee.getReportingManager() == null) {
            return false;
        }
        Long reviewerManagerId = reviewer.getReportingManager().getId();
        Long revieweeManagerId = reviewee.getReportingManager().getId();
        return reviewerManagerId != null && reviewerManagerId.equals(revieweeManagerId);
    }

    private boolean isSubordinateReviewingManager(Employee reviewer, Employee reviewee) {
        return reviewer.getReportingManager() != null
                && reviewer.getReportingManager().getId() != null
                && reviewer.getReportingManager().getId().equals(reviewee.getId());
    }

    private PerformanceReviewCycleDto.Response toCycleResponse(PerformanceReviewCycle cycle, int notifiedMemberCount) {
        return PerformanceReviewCycleDto.Response.builder()
                .id(cycle.getId())
                .managerId(cycle.getManagerId())
                .reviewPeriod(cycle.getReviewPeriod())
                .startAt(cycle.getStartAt())
                .endAt(cycle.getEndAt())
                .status(cycle.getStatus())
                .notifiedMemberCount(notifiedMemberCount)
                .build();
    }
}