package com.company.ems.backend.performance.review.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.exception.AppException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.service.NotificationService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.review.dto.PerformanceReviewCycleDto;
import com.company.ems.backend.performance.review.entity.PerformanceReview;
import com.company.ems.backend.performance.review.entity.PerformanceReviewCycle;
import com.company.ems.backend.performance.review.enums.ReviewCycleStatus;
import com.company.ems.backend.performance.review.enums.ReviewType;
import com.company.ems.backend.performance.review.mapper.PerformanceReviewMapper;
import com.company.ems.backend.performance.review.repository.PerformanceReviewCycleRepository;
import com.company.ems.backend.performance.review.repository.PerformanceReviewRepository;

@ExtendWith(MockitoExtension.class)
class PerformanceReviewServiceImplTest {

    @Mock private PerformanceReviewRepository reviewRepo;
    @Mock private PerformanceReviewCycleRepository cycleRepo;
    @Mock private EmployeeRepository employeeRepo;
    @Mock private PerformanceReviewMapper mapper;
    @Mock private MessageService messages;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PerformanceReviewServiceImpl service;

    private Employee reviewee;

    @BeforeEach
    void setUp() {
        reviewee = new Employee();
        reviewee.setId(10L);
        reviewee.setFirstName("Nguyen");
        reviewee.setLastName("Van A");
    }

    // ─── Helper to mock SecurityContext ────────────────────────────────────
    private void mockAuthentication(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn(username);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }

    // ─── saveReview ─────────────────────────────────────────────────────────

    @Test
    void saveReview_success() {
        // Given
        mockAuthentication("manager1");
        Employee managerEmp = new Employee();
        managerEmp.setId(1L);
        reviewee.setReportingManager(managerEmp);

        when(employeeRepo.findById(10L)).thenReturn(Optional.of(reviewee));
        when(employeeRepo.findByUserUsername("manager1")).thenReturn(Optional.of(managerEmp));
        when(reviewRepo.existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(1L, 10L, "2026-Q1"))
                .thenReturn(false);

        PerformanceReview saved = PerformanceReview.builder()
                .reviewerId(1L).revieweeId(10L)
                .reviewerUsername("manager1").revieweeUsername("Nguyen Van A")
                .reviewType(ReviewType.MANAGER).reviewPeriod("2026-Q1")
                .expertiseScore(85).communicationScore(80).attitudeScore(90)
                .build();
        saved.recalculate();

        when(reviewRepo.save(any(PerformanceReview.class))).thenReturn(saved);
        PerformanceReviewDto.Response expected = PerformanceReviewDto.Response.builder()
                .id(null).totalScore(saved.getTotalScore()).build();
        when(mapper.toResponse(saved)).thenReturn(expected);

        PerformanceReviewDto.ScoresRequest scores = new PerformanceReviewDto.ScoresRequest();
        scores.setExpertise(85);
        scores.setCommunication(80);
        scores.setAttitude(90);

        PerformanceReviewDto.CreateRequest req = new PerformanceReviewDto.CreateRequest();
        req.setRevieweeId(10L);
        req.setReviewType(ReviewType.MANAGER);
        req.setReviewPeriod("2026-Q1");
        req.setScores(scores);

        // When
        PerformanceReviewDto.Response result = service.saveReview(req);

        // Then
        assertNotNull(result);
        verify(reviewRepo).save(any(PerformanceReview.class));
    }

    @Test
    void saveReview_duplicatePeriod_throws() {
        // Given
        mockAuthentication("manager1");
        Employee managerEmp = new Employee();
        managerEmp.setId(1L);
        reviewee.setReportingManager(managerEmp);

        when(employeeRepo.findById(10L)).thenReturn(Optional.of(reviewee));
        when(employeeRepo.findByUserUsername("manager1")).thenReturn(Optional.of(managerEmp));
        when(reviewRepo.existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(1L, 10L, "2026-Q1"))
                .thenReturn(true);
        lenient().when(messages.get(eq(MessageCode.REVIEW_DUPLICATE), (Object[]) any())).thenReturn("Duplicate review");

        PerformanceReviewDto.ScoresRequest scores = new PerformanceReviewDto.ScoresRequest();
        scores.setExpertise(80); scores.setCommunication(80); scores.setAttitude(80);

        PerformanceReviewDto.CreateRequest req = new PerformanceReviewDto.CreateRequest();
        req.setRevieweeId(10L);
        req.setReviewType(ReviewType.MANAGER);
        req.setReviewPeriod("2026-Q1");
        req.setScores(scores);

        // When / Then
        AppException ex = assertThrows(AppException.class, () -> service.saveReview(req));
        assertEquals(ErrorCode.RESOURCE_CONFLICT, ex.getErrorCode());
        verify(reviewRepo, never()).save(any());
    }

    @Test
    void saveReview_peerReview_betweenDifferentTeams_throws() {
        // Given – reviewer and reviewee are not in same manager group
        mockAuthentication("manager1");
        Employee reviewerEmp = new Employee();
        reviewerEmp.setId(1L);

        Employee reviewerManager = new Employee();
        reviewerManager.setId(7L);
        reviewerEmp.setReportingManager(reviewerManager);

        Employee revieweeManager = new Employee();
        revieweeManager.setId(8L);
        reviewee.setReportingManager(revieweeManager);

        when(employeeRepo.findById(10L)).thenReturn(Optional.of(reviewee));
        when(employeeRepo.findByUserUsername("manager1")).thenReturn(Optional.of(reviewerEmp));

        PerformanceReviewDto.ScoresRequest scores = new PerformanceReviewDto.ScoresRequest();
        scores.setExpertise(80); scores.setCommunication(80); scores.setAttitude(80);

        PerformanceReviewDto.CreateRequest req = new PerformanceReviewDto.CreateRequest();
        req.setRevieweeId(10L);
        req.setReviewType(ReviewType.PEER);
        req.setReviewPeriod("2026-Q1");
        req.setScores(scores);

        // When / Then
        AppException ex = assertThrows(AppException.class, () -> service.saveReview(req));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    void openReviewCycle_success() {
        mockAuthentication("manager1");

        Employee managerEmp = new Employee();
        managerEmp.setId(1L);

        Employee report = new Employee();
        report.setId(2L);
        com.company.ems.backend.user.entity.User reportUser = new com.company.ems.backend.user.entity.User();
        reportUser.setId(20L);
        report.setUser(reportUser);

        when(employeeRepo.findByUserUsername("manager1")).thenReturn(Optional.of(managerEmp));
        when(cycleRepo.findActiveCycleByManager(eq(1L), eq(ReviewCycleStatus.OPEN), any())).thenReturn(Optional.empty());
        when(cycleRepo.save(any(PerformanceReviewCycle.class))).thenAnswer(inv -> {
            PerformanceReviewCycle c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });
        when(employeeRepo.findDirectReportsByManagerId(1L)).thenReturn(List.of(report));

        PerformanceReviewCycleDto.OpenRequest request = new PerformanceReviewCycleDto.OpenRequest();
        request.setReviewPeriod("2026-Q1");

        PerformanceReviewCycleDto.Response response = service.openReviewCycle(request);

        assertNotNull(response);
        assertEquals("2026-Q1", response.getReviewPeriod());
        assertEquals(1, response.getNotifiedMemberCount());
    }

        @Test
        void saveReview_upwardFeedback_success() {
        mockAuthentication("employee1");

        Employee manager = new Employee();
        manager.setId(7L);
        manager.setFirstName("Lead");
        manager.setLastName("One");

        Employee reviewerEmp = new Employee();
        reviewerEmp.setId(1L);
        reviewerEmp.setFirstName("Emp");
        reviewerEmp.setLastName("A");
        reviewerEmp.setReportingManager(manager);

        when(employeeRepo.findByUserUsername("employee1")).thenReturn(Optional.of(reviewerEmp));
        when(employeeRepo.findById(7L)).thenReturn(Optional.of(manager));

        when(reviewRepo.existsByReviewerIdAndRevieweeIdAndReviewPeriodAndIsDeletedFalse(1L, 7L, "2026-Q1"))
            .thenReturn(false);

        when(reviewRepo.save(any(PerformanceReview.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(PerformanceReview.class))).thenReturn(PerformanceReviewDto.Response.builder().build());

        PerformanceReviewDto.ScoresRequest scores = new PerformanceReviewDto.ScoresRequest();
        scores.setExpertise(85);
        scores.setCommunication(84);
        scores.setAttitude(83);

        PerformanceReviewDto.CreateRequest req = new PerformanceReviewDto.CreateRequest();
        req.setRevieweeId(7L);
        req.setReviewType(ReviewType.PEER);
        req.setReviewPeriod("2026-Q1");
        req.setScores(scores);

        service.saveReview(req);

        ArgumentCaptor<PerformanceReview> savedCaptor = ArgumentCaptor.forClass(PerformanceReview.class);
        verify(reviewRepo, times(1)).save(savedCaptor.capture());
        assertEquals(ReviewType.UPWARD, savedCaptor.getValue().getReviewType());
        }

    @Test
    void getReview_notFound_throws() {
        // Given
        when(reviewRepo.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());
        when(messages.get(eq(MessageCode.REVIEW_NOT_FOUND), any())).thenReturn("Not found");

        // When / Then
        AppException ex = assertThrows(AppException.class, () -> service.getReview(999L));
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getLatestForEmployee_noReviews_returnsEmptyResponse() {
        // Given
        when(reviewRepo.findTopByRevieweeId(eq(10L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        // When
        PerformanceReviewDto.Response response = service.getLatestForEmployee(10L);

        // Then
        assertNotNull(response);
        assertEquals(10L, response.getRevieweeId());
        assertEquals(0, response.getTotalScore());
        assertEquals("Chưa có đánh giá", response.getRank());
    }

    @Test
    void listReviews_returnsPaginatedResult() {
        // Given
        PerformanceReview review = PerformanceReview.builder()
                .revieweeId(10L).totalScore(85).build();
        when(reviewRepo.findByRevieweeIdAndOptionalPeriod(eq(10L), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review)));
        PerformanceReviewDto.Response dto = PerformanceReviewDto.Response.builder().revieweeId(10L).build();
        when(mapper.toResponse(review)).thenReturn(dto);

        // When
        PageResponse<PerformanceReviewDto.Response> page = service.listReviews(10L, null, 0, 10);

        // Then
        assertNotNull(page);
        assertEquals(1, page.getContent().size());
    }
}
