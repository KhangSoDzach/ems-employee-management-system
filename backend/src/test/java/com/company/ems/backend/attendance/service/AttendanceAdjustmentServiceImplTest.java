package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestCreateDto;
import com.company.ems.backend.attendance.dto.adjustment.ApprovalActionDto;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentHistory;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentRequest;
import com.company.ems.backend.attendance.enums.AdjustmentReason;
import com.company.ems.backend.attendance.enums.AdjustmentRequestStatus;
import com.company.ems.backend.attendance.repository.AttendanceAdjustmentHistoryRepository;
import com.company.ems.backend.attendance.repository.AttendanceAdjustmentRequestRepository;
import com.company.ems.backend.attendance.repository.AttendanceRepository;
import com.company.ems.backend.attendance.mapper.AttendanceMapper;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.service.NotificationService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.AssigneeType;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.config.OfficeLocationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AttendanceAdjustmentServiceImpl}.
 *
 * <p>Covers:
 * <ul>
 *   <li>submitRequest — happy path and validation failure
 *   <li>approve — single-level flow ending in APPROVED
 *   <li>reject — state transition + validation
 * </ul>
 */
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AttendanceAdjustmentServiceImpl – Unit Tests")
class AttendanceAdjustmentServiceImplTest {

        /* ── Mocks ──────────────────────────────────────────────────────────── */
        @Mock
        AttendanceAdjustmentRequestRepository requestRepository;
        @Mock
        AttendanceAdjustmentHistoryRepository historyRepository;
        @Mock
        AttendanceRepository attendanceRepository;
        @Mock
        EmployeeRepository employeeRepository;
        @Mock
        UserRepository userRepository;
        @Mock
        WorkflowEngineService workflowEngineService;
        @Mock
        NotificationService notificationService;
        @Mock
        MessageService messages;
        @Mock
        AttendanceMapper attendanceMapper;
        @Mock
        OfficeLocationProperties officeProps;

        @InjectMocks
        AttendanceAdjustmentServiceImpl service;

        /* ── Shared fixtures ─────────────────────────────────────────────────── */
        private CustomUserPrincipal principal;
        private Employee employee;
        private User user;
        private WorkflowTemplate template;
        private WorkflowLevel level1;

        @BeforeEach
        void setUp() {
                principal = mock(CustomUserPrincipal.class);
                when(principal.getUserId()).thenReturn(1L);
                when(principal.getUsername()).thenReturn("emp001");

                user = User.builder().username("emp001").build();
                user.setId(1L);

                employee = Employee.builder().employeeCode("EMP001").build();
                employee.setId(10L);

                when(userRepository.findById(1L)).thenReturn(Optional.of(user));
                when(employeeRepository.findByUserId(1L)).thenReturn(Optional.of(employee));

                // 1-level workflow template
                level1 = WorkflowLevel.builder()
                                .levelNumber(1)
                                .assigneeType(AssigneeType.ROLE)
                                .assigneeRole("ROLE_MANAGER")
                                .timeoutHours(24)
                                .build();
                level1.setId(100L);

                template = WorkflowTemplate.builder()
                                .name("Default 1-Level")
                                .workflowType(WorkflowType.MANUAL_ATTENDANCE_ADJUSTMENT)
                                .isActive(true)
                                .levels(List.of(level1))
                                .build();
                template.setId(1L);

                level1.setTemplate(template);

                // Standard mock for messages
                lenient().when(messages.get(any(MessageCode.class), any())).thenReturn("Mocked Message");
                lenient().when(messages.get(any(MessageCode.class))).thenReturn("Mocked Message");

                // Mock office properties
                lenient().when(officeProps.getShift1CheckIn()).thenReturn("08:00");
                lenient().when(officeProps.getShift1CheckOut()).thenReturn("12:00");
                lenient().when(officeProps.getShift2CheckIn()).thenReturn("13:30");
                lenient().when(officeProps.getShift2CheckOut()).thenReturn("17:30");
                lenient().when(officeProps.getGracePeriod()).thenReturn(15);
                lenient().when(officeProps.getEarlyLeaveThreshold()).thenReturn(15);

                // Mock mapper
                lenient().when(attendanceMapper.toDetailResponse(any()))
                                .thenReturn(new com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse());
        }

        /* ── submitRequest ───────────────────────────────────────────────────── */
        @Nested
        @DisplayName("submitRequest()")
        class SubmitRequest {

                private AdjustmentRequestCreateDto validDto() {
                        return AdjustmentRequestCreateDto.builder()
                                        .requestDate(LocalDate.now().minusDays(1))
                                        .proposedCheckInTime(LocalDateTime.now().minusDays(1).withHour(8).withMinute(0))
                                        .proposedCheckOutTime(null)
                                        .reasonType(AdjustmentReason.FORGOT_CHECKIN)
                                        .reasonText("I forgot to check in because I was in a meeting.")
                                        .build();
                }

                @Test
                @DisplayName("Happy path → request saved with PENDING_LEVEL_1 and history recorded")
                void success_savesPendingRequest() {
                        when(workflowEngineService.getActiveTemplate(WorkflowType.MANUAL_ATTENDANCE_ADJUSTMENT))
                                        .thenReturn(template);
                        when(workflowEngineService.getLevels(template))
                                        .thenReturn(List.of(level1));
                        when(attendanceRepository.findByEmployeeIdAndDate(10L, LocalDate.now().minusDays(1)))
                                        .thenReturn(Optional.empty());
                        when(requestRepository.save(any()))
                                        .thenAnswer(inv -> {
                                                AttendanceAdjustmentRequest r = inv.getArgument(0);
                                                r.setId(99L);
                                                return r;
                                        });
                        when(historyRepository.save(any()))
                                        .thenAnswer(inv -> inv.getArgument(0));
                        when(workflowEngineService.resolveApproverUserIds(level1))
                                        .thenReturn(Collections.emptyList());

                        service.submitRequest(validDto(), principal);

                        ArgumentCaptor<AttendanceAdjustmentRequest> captor = ArgumentCaptor
                                        .forClass(AttendanceAdjustmentRequest.class);
                        verify(requestRepository).save(captor.capture());

                        AttendanceAdjustmentRequest saved = captor.getValue();
                        assertThat(saved.getStatus()).isEqualTo(AdjustmentRequestStatus.PENDING_LEVEL_1);
                        assertThat(saved.getCurrentApprovalLevel()).isEqualTo(1);
                        assertThat(saved.getMaxApprovalLevel()).isEqualTo(1);
                        assertThat(saved.getEmployee()).isSameAs(employee);
                }

                @Test
                @DisplayName("No proposed times → throws BusinessException")
                void noProposedTimes_throws() {
                        AdjustmentRequestCreateDto dto = AdjustmentRequestCreateDto.builder()
                                        .requestDate(LocalDate.now().minusDays(1))
                                        .proposedCheckInTime(null)
                                        .proposedCheckOutTime(null)
                                        .reasonType(AdjustmentReason.FORGOT_CHECKIN)
                                        .reasonText("At least 10 chars reason text.")
                                        .build();

                        assertThatThrownBy(() -> service.submitRequest(dto, principal))
                                        .isInstanceOf(BusinessException.class);

                        verify(requestRepository, never()).save(any());
                }
        }

        /* ── approve ─────────────────────────────────────────────────────────── */
        @Nested
        @DisplayName("approve()")
        class Approve {

                private AttendanceAdjustmentRequest pendingRequest() {
                        AttendanceAdjustmentRequest r = AttendanceAdjustmentRequest.builder()
                                        .employee(employee)
                                        .requestDate(LocalDate.now().minusDays(1))
                                        .proposedCheckInTime(LocalDateTime.now().minusDays(1).withHour(8))
                                        .reasonType(AdjustmentReason.FORGOT_CHECKIN)
                                        .reasonText("Reason text with enough characters.")
                                        .status(AdjustmentRequestStatus.PENDING_LEVEL_1)
                                        .currentApprovalLevel(1)
                                        .maxApprovalLevel(1)
                                        .workflowTemplateId(1L)
                                        .build();
                        r.setId(99L);
                        return r;
                }

                @Test
                @DisplayName("L1 approve on 1-level workflow → status becomes APPROVED")
                void singleLevelApprove_becomesApproved() {
                        AttendanceAdjustmentRequest request = pendingRequest();

                        // Principal must have approval authority
                        when(principal.getAuthorities()).thenAnswer(inv -> List
                                        .of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                                        "ATTENDANCE_ADJUSTMENT_APPROVE")));

                        when(requestRepository.findById(99L)).thenReturn(Optional.of(request));
                        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                        when(historyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                        when(attendanceRepository.findByEmployeeIdAndDate(any(), any()))
                                        .thenReturn(Optional.empty());
                        when(attendanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                        service.approve(99L, new ApprovalActionDto("Approved — looks correct."), principal);

                        assertThat(request.getStatus()).isEqualTo(AdjustmentRequestStatus.APPROVED);
                        // History saved at least twice: APPROVED + APPLIED_TO_ATTENDANCE
                        verify(historyRepository, atLeast(2)).save(any(AttendanceAdjustmentHistory.class));
                }
        }

        /* ── reject ──────────────────────────────────────────────────────────── */
        @Nested
        @DisplayName("reject()")
        class Reject {

                @Test
                @DisplayName("Blank reason → throws BusinessException before touching DB")
                void blankReason_throws() {
                        assertThatThrownBy(() -> service.reject(99L, new ApprovalActionDto(""), principal))
                                        .isInstanceOf(BusinessException.class);

                        verify(requestRepository, never()).findById(any());
                }

                @Test
                @DisplayName("Valid rejection → status becomes REJECTED")
                void validRejection_becomesRejected() {
                        AttendanceAdjustmentRequest request = AttendanceAdjustmentRequest.builder()
                                        .employee(employee)
                                        .requestDate(LocalDate.now().minusDays(1))
                                        .proposedCheckInTime(LocalDateTime.now().minusDays(1).withHour(8))
                                        .reasonType(AdjustmentReason.DEVICE_ERROR)
                                        .reasonText("Device was malfunctioning that day.")
                                        .status(AdjustmentRequestStatus.PENDING_LEVEL_1)
                                        .currentApprovalLevel(1)
                                        .maxApprovalLevel(1)
                                        .workflowTemplateId(1L)
                                        .build();
                        request.setId(99L);

                        when(principal.getAuthorities()).thenAnswer(inv -> List
                                        .of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                                        "ATTENDANCE_ADJUSTMENT_APPROVE")));
                        when(requestRepository.findById(99L)).thenReturn(Optional.of(request));
                        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                        when(historyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                        service.reject(99L, new ApprovalActionDto("Bằng chứng không đầy đủ."), principal);

                        assertThat(request.getStatus()).isEqualTo(AdjustmentRequestStatus.REJECTED);
                        verify(historyRepository).save(any(AttendanceAdjustmentHistory.class));
                }
        }
}
