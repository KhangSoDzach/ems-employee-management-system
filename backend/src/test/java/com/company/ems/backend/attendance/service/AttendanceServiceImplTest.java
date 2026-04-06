package com.company.ems.backend.attendance.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.attendance.dto.AttendanceCalendarResponse;
import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.attendance.enums.AttendanceStatus;
import com.company.ems.backend.attendance.mapper.AttendanceMapper;
import com.company.ems.backend.attendance.repository.AttendanceRepository;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.service.GeolocationService;
import com.company.ems.backend.common.service.PhotoStorageService;
import com.company.ems.backend.config.OfficeLocationProperties;
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;

/**
 * Unit tests for {@link AttendanceServiceImpl}.
 *
 * <p>
 * All external collaborators are mocked; no Spring context is required.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceServiceImpl – Unit Tests")
class AttendanceServiceImplTest {

        private static final String ERROR_CODE_FIELD = "errorCode";

        /* ── Mocks ──────────────────────────────────────────────────────────── */
        @Mock
        AttendanceRepository attendanceRepository;
        @Mock
        AttendanceMapper attendanceMapper;
        @Mock
        EmployeeRepository employeeRepository;
        @Mock
        GeolocationService geolocationService;
        @Mock
        PhotoStorageService photoStorageService;
        @Mock
        MessageService messages;
        @Mock
        StorageProperties storageProperties;
        @Mock
        OfficeLocationProperties officeProps;

        @InjectMocks
        AttendanceServiceImpl service;

        /* ── Shared fixtures ─────────────────────────────────────────────────── */
        private CustomUserPrincipal principal;
        private Employee employee;

        @BeforeEach
        void setUp() {
                principal = mock(CustomUserPrincipal.class);
                lenient().when(principal.getUserId()).thenReturn(1L);

                employee = Employee.builder()
                                .employeeCode("EMP001")
                                .build();
                employee.setId(10L);

                lenient().when(employeeRepository.findByUserId(1L)).thenReturn(Optional.of(employee));

                // Provide a base URL so buildPhotoUrl() doesn't NPE
                lenient().when(storageProperties.getBaseUrl())
                                .thenReturn("http://localhost:8080/uploads/attendance-photos");

                // Mock messages
                lenient().when(messages.get(any(MessageCode.class), any())).thenReturn("Mocked Message");
                lenient().when(messages.get(any(MessageCode.class))).thenReturn("Mocked Message");

                // Mock office properties
                lenient().when(officeProps.getShift1CheckIn()).thenReturn("08:00");
                lenient().when(officeProps.getShift1CheckOut()).thenReturn("12:00");
                lenient().when(officeProps.getShift2CheckIn()).thenReturn("13:30");
                lenient().when(officeProps.getShift2CheckOut()).thenReturn("17:30");
                lenient().when(officeProps.getGracePeriod()).thenReturn(15);
                lenient().when(officeProps.getEarlyLeaveThreshold()).thenReturn(15);

                lenient().when(attendanceMapper.toResponse(any(Attendance.class))).thenAnswer(inv -> {
                        Attendance attendance = inv.getArgument(0);
                        var response = new com.company.ems.backend.attendance.dto.AttendanceResponse();
                        response.setStatus(attendance.getStatus() != null ? attendance.getStatus().name() : null);
                        response.setEmployeeId(
                                        attendance.getEmployee() != null ? attendance.getEmployee().getId() : null);
                        return response;
                });
        }

        /* ── checkIn ─────────────────────────────────────────────────────────── */
        @Nested
        @DisplayName("checkIn()")
        class CheckInTests {

                private CheckInRequest buildRequest(double lat, double lon) {
                        return CheckInRequest.builder()
                                        .latitude(lat)
                                        .longitude(lon)
                                        .photoBase64("data:image/jpeg;base64,/9j/fake=")
                                        .locationLabel("Office")
                                        .build();
                }

                @Test
                @DisplayName("Happy path → Attendance saved with correct employee and status")
                void successSavesAttendance() {
                        when(attendanceRepository.existsByEmployeeIdAndDate(10L, LocalDate.now()))
                                        .thenReturn(false);
                        doNothing().when(geolocationService)
                                        .validateWithinOfficeRadiusForEmployee(any(Employee.class), anyDouble(),
                                                        anyDouble());
                        when(photoStorageService.savePhoto(anyString(), anyString()))
                                        .thenReturn("uploads/attendance-photos/EMP001/checkin_123.jpg");

                        ArgumentCaptor<Attendance> captor = ArgumentCaptor.forClass(Attendance.class);
                        when(attendanceRepository.save(captor.capture()))
                                        .thenAnswer(inv -> inv.getArgument(0));

                        service.checkIn(buildRequest(10.7626, 106.6601), principal);

                        Attendance saved = captor.getValue();
                        assertThat(saved.getEmployee()).isSameAs(employee);
                        assertThat(saved.getDate()).isEqualTo(LocalDate.now());
                        assertThat(saved.getCheckInTime()).isNotNull();
                        assertThat(saved.getCheckInPhotoUrl())
                                        .isEqualTo("uploads/attendance-photos/EMP001/checkin_123.jpg");
                        assertThat(saved.getStatus())
                                        .isIn(AttendanceStatus.PRESENT, AttendanceStatus.LATE);
                }

                @Test
                @DisplayName("Duplicate check-in → throws ALREADY_CHECKED_IN")
                void duplicateThrows() {
                        when(attendanceRepository.existsByEmployeeIdAndDate(10L, LocalDate.now()))
                                        .thenReturn(true);

                        assertThatThrownBy(() -> service.checkIn(buildRequest(10.7626, 106.6601), principal))
                                        .isInstanceOf(BusinessException.class)
                                        .extracting(ERROR_CODE_FIELD)
                                        .isEqualTo("ALREADY_CHECKED_IN");

                        verify(photoStorageService, never()).savePhoto(any(), any());
                        verify(attendanceRepository, never()).save(any(Attendance.class));
                }

                @Test
                @DisplayName("Location outside 30 m → throws LOCATION_OUT_OF_RANGE")
                void outsideRadiusThrows() {
                        when(attendanceRepository.existsByEmployeeIdAndDate(10L, LocalDate.now()))
                                        .thenReturn(false);
                        doThrow(new BusinessException("LOCATION_OUT_OF_RANGE",
                                        "You are too far from the office."))
                                        .when(geolocationService)
                                        .validateWithinOfficeRadiusForEmployee(any(Employee.class), anyDouble(),
                                                        anyDouble());

                        assertThatThrownBy(() -> service.checkIn(buildRequest(0.0, 0.0), principal))
                                        .isInstanceOf(BusinessException.class)
                                        .extracting(ERROR_CODE_FIELD)
                                        .isEqualTo("LOCATION_OUT_OF_RANGE");

                        verify(photoStorageService, never()).savePhoto(any(), any());
                        verify(attendanceRepository, never()).save(any(Attendance.class));
                }

                @Test
                @DisplayName("Employee not found → throws ResourceNotFoundException")
                void employeeNotFoundThrows() {
                        when(employeeRepository.findByUserId(1L)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> service.checkIn(buildRequest(10.7, 106.6), principal))
                                        .isInstanceOf(RuntimeException.class);
                }
        }

        @Nested
        @DisplayName("getMonthlyCalendar()")
        class GetMonthlyCalendarTests {

                @Test
                @DisplayName("Returns calendar days and metrics with previous-month trend")
                void returnsCalendarAndMetrics() {
                        Employee fullEmployee = Employee.builder()
                                        .firstName("Nguyen")
                                        .lastName("Van A")
                                        .employeeCode("EMP001")
                                        .build();
                        fullEmployee.setId(10L);

                        when(employeeRepository.findById(10L)).thenReturn(Optional.of(fullEmployee));

                        Attendance current1 = Attendance.builder()
                                        .date(LocalDate.of(2026, 3, 2))
                                        .status(AttendanceStatus.PRESENT)
                                        .workHours(500)
                                        .checkInTime(LocalDateTime.of(2026, 3, 2, 8, 0))
                                        .checkOutTime(LocalDateTime.of(2026, 3, 2, 17, 10))
                                        .build();
                        Attendance current2 = Attendance.builder()
                                        .date(LocalDate.of(2026, 3, 3))
                                        .status(AttendanceStatus.LATE)
                                        .workHours(470)
                                        .checkInTime(LocalDateTime.of(2026, 3, 3, 8, 30))
                                        .checkOutTime(null)
                                        .build();
                        Attendance current3 = Attendance.builder()
                                        .date(LocalDate.of(2026, 3, 4))
                                        .status(AttendanceStatus.ABSENT)
                                        .workHours(null)
                                        .checkInTime(null)
                                        .checkOutTime(null)
                                        .build();

                        Attendance prev1 = Attendance.builder()
                                        .date(LocalDate.of(2026, 2, 1))
                                        .status(AttendanceStatus.PRESENT)
                                        .workHours(500)
                                        .checkOutTime(LocalDateTime.of(2026, 2, 1, 17, 0))
                                        .build();

                        when(attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(
                                        10L,
                                        LocalDate.of(2026, 3, 1),
                                        LocalDate.of(2026, 3, 31)))
                                        .thenReturn(List.of(current1, current2, current3));
                        when(attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateAsc(
                                        10L,
                                        LocalDate.of(2026, 2, 1),
                                        LocalDate.of(2026, 2, 28)))
                                        .thenReturn(List.of(prev1));

                        when(attendanceRepository.countByEmployeeIdAndDateBetweenAndCheckOutTimeIsNull(
                                        10L,
                                        LocalDate.of(2026, 3, 1),
                                        LocalDate.of(2026, 3, 31)))
                                        .thenReturn(2L);
                        when(attendanceRepository.countByEmployeeIdAndDateBetweenAndCheckOutTimeIsNull(
                                        10L,
                                        LocalDate.of(2026, 2, 1),
                                        LocalDate.of(2026, 2, 28)))
                                        .thenReturn(0L);

                        AttendanceCalendarResponse response = service.getMonthlyCalendar(null, "2026-03", principal);

                        assertThat(response.getMonth()).isEqualTo("2026-03");
                        assertThat(response.getEmployeeId()).isEqualTo(10L);
                        assertThat(response.getEmployeeName()).isEqualTo("Nguyen Van A");

                        assertThat(response.getFullWorkDays().getCurrent()).isEqualTo(1);
                        assertThat(response.getLateDays().getCurrent()).isEqualTo(1);
                        assertThat(response.getNoClockOutDays().getCurrent()).isEqualTo(2);
                        assertThat(response.getAbsentDays().getCurrent()).isEqualTo(1);

                        assertThat(response.getDays()).hasSize(31);
                        assertThat(response.getDays().stream().filter(d -> Boolean.TRUE.equals(d.getHasRecord())).count())
                                        .isEqualTo(3);
                }

                @Test
                @DisplayName("Invalid month format throws BusinessException")
                void invalidMonthFormatThrows() {
                        assertThatThrownBy(() -> service.getMonthlyCalendar(null, "03-2026", principal))
                                        .isInstanceOf(BusinessException.class)
                                        .extracting(ERROR_CODE_FIELD)
                                        .isEqualTo("INVALID_MONTH_FORMAT");
                }
        }
}
