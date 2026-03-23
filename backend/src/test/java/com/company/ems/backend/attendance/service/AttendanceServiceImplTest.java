package com.company.ems.backend.attendance.service;

import java.time.LocalDate;
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
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.rbac.service.DataScopeService;

/**
 * Unit tests for {@link AttendanceServiceImpl}.
 *
 * <p>
 * All external collaborators are mocked; no Spring context is required.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceServiceImpl – Unit Tests")
class AttendanceServiceImplTest {

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
        DataScopeService dataScopeService;
        @Mock
        MessageService messages;
        @Mock
        StorageProperties storageProperties;

        @InjectMocks
        AttendanceServiceImpl service;

        /* ── Shared fixtures ─────────────────────────────────────────────────── */
        private CustomUserPrincipal principal;
        private Employee employee;

        @BeforeEach
        void setUp() {
                principal = mock(CustomUserPrincipal.class);
                when(principal.getUserId()).thenReturn(1L);

                employee = Employee.builder()
                                .employeeCode("EMP001")
                                .build();
                employee.setId(10L);

                when(employeeRepository.findByUserId(1L)).thenReturn(Optional.of(employee));

                // Provide a base URL so buildPhotoUrl() doesn't NPE
                lenient().when(storageProperties.getBaseUrl())
                                .thenReturn("http://localhost:8080/uploads/attendance-photos");

                // Mock messages
                lenient().when(messages.get(any(MessageCode.class), any())).thenReturn("Mocked Message");
                lenient().when(messages.get(any(MessageCode.class))).thenReturn("Mocked Message");

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
        class CheckIn {

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
                void success_savesAttendance() {
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
                void duplicate_throws() {
                        when(attendanceRepository.existsByEmployeeIdAndDate(10L, LocalDate.now()))
                                        .thenReturn(true);

                        assertThatThrownBy(() -> service.checkIn(buildRequest(10.7626, 106.6601), principal))
                                        .isInstanceOf(BusinessException.class)
                                        .extracting("errorCode")
                                        .isEqualTo("ALREADY_CHECKED_IN");

                        verify(photoStorageService, never()).savePhoto(any(), any());
                        verify(attendanceRepository, never()).save(any());
                }

                @Test
                @DisplayName("Location outside 30 m → throws LOCATION_OUT_OF_RANGE")
                void outsideRadius_throws() {
                        when(attendanceRepository.existsByEmployeeIdAndDate(10L, LocalDate.now()))
                                        .thenReturn(false);
                        doThrow(new BusinessException("LOCATION_OUT_OF_RANGE",
                                        "You are too far from the office."))
                                        .when(geolocationService)
                                        .validateWithinOfficeRadiusForEmployee(any(Employee.class), anyDouble(),
                                                        anyDouble());

                        assertThatThrownBy(() -> service.checkIn(buildRequest(0.0, 0.0), principal))
                                        .isInstanceOf(BusinessException.class)
                                        .extracting("errorCode")
                                        .isEqualTo("LOCATION_OUT_OF_RANGE");

                        verify(photoStorageService, never()).savePhoto(any(), any());
                        verify(attendanceRepository, never()).save(any());
                }

                @Test
                @DisplayName("Employee not found → throws ResourceNotFoundException")
                void employeeNotFound_throws() {
                        when(employeeRepository.findByUserId(1L)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> service.checkIn(buildRequest(10.7, 106.6), principal))
                                        .isInstanceOf(RuntimeException.class);
                }
        }
}
