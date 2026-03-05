package com.company.ems.backend.attendance.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.attendance.dto.CheckOutRequest;
import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.attendance.enums.AttendanceStatus;
import com.company.ems.backend.attendance.enums.CheckInMethod;
import com.company.ems.backend.attendance.repository.AttendanceRepository;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.service.GeolocationService;
import com.company.ems.backend.common.service.PhotoStorageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link AttendanceService}.
 *
 * <p><strong>Check-in flow:</strong>
 * <ol>
 *   <li>Resolve employee from the JWT principal.
 *   <li>Guard against duplicate check-in on the same calendar day.
 *   <li>Run server-side Haversine distance validation.
 *   <li>Decode and persist the photo to the local filesystem.
 *   <li>Persist the {@link Attendance} record.
 * </ol>
 *
 * <p><strong>Check-out flow:</strong> mirrors the above but updates the existing record,
 * sets {@code checkOutTime}, and auto-calculates work hours.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository  attendanceRepository;
    private final EmployeeRepository    employeeRepository;
    private final GeolocationService    geolocationService;
    private final PhotoStorageService   photoStorageService;

    // ─── Check-in ─────────────────────────────────────────────────────────────

    @Override
    public AttendanceResponse checkIn(CheckInRequest request, CustomUserPrincipal principal) {
        Employee employee = resolveEmployee(principal);

        // Guard: already checked in today?
        LocalDate today = LocalDate.now();
        if (attendanceRepository.existsByEmployeeIdAndDate(employee.getId(), today)) {
            throw new BusinessException("ALREADY_CHECKED_IN",
                    "Bạn đã check-in hôm nay rồi. Vui lòng check-out trước.");
        }

        // Validate distance (throws BusinessException if out of range)
        geolocationService.validateWithinOfficeRadius(request.getLatitude(), request.getLongitude());

        // Save photo to filesystem
        String photoPath = photoStorageService.savePhoto(
                request.getPhotoBase64(),
                safeCode(employee));

        // Determine if the employee is late
        LocalDateTime checkInTime = LocalDateTime.now();
        boolean isLate = checkInTime.toLocalTime().isAfter(LocalTime.of(9, 0)); // 09:00 standard start

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .date(today)
                .checkInTime(checkInTime)
                .checkInLatitude(request.getLatitude())
                .checkInLongitude(request.getLongitude())
                .checkInLocation(request.getLocationLabel())
                .checkInPhotoUrl(photoPath)
                .checkInMethod(request.getCheckInMethod() != null
                        ? request.getCheckInMethod()
                        : CheckInMethod.CAMERA_GEO)
                .status(isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT)
                .isLate(isLate)
                .isOvertime(false)
                .isRemote(false)
                .notes(request.getNotes())
                .ipAddress(request.getIpAddress())
                .deviceInfo(request.getDeviceInfo())
                .userAgent(request.getUserAgent())
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Employee [{}] checked in at {} (lat={}, lon={})",
                employee.getEmployeeCode(), checkInTime,
                request.getLatitude(), request.getLongitude());
        return mapToResponse(saved);
    }

    // ─── Check-out ────────────────────────────────────────────────────────────

    @Override
    public AttendanceResponse checkOut(CheckOutRequest request, CustomUserPrincipal principal) {
        Employee employee = resolveEmployee(principal);

        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository
                .findByEmployeeIdAndDate(employee.getId(), today)
                .orElseThrow(() -> new BusinessException("NOT_CHECKED_IN",
                        "Không tìm thấy bản ghi check-in hôm nay. Vui lòng check-in trước."));

        if (attendance.getCheckOutTime() != null) {
            throw new BusinessException("ALREADY_CHECKED_OUT",
                    "Bạn đã check-out hôm nay rồi.");
        }

        // Validate distance
        geolocationService.validateWithinOfficeRadius(request.getLatitude(), request.getLongitude());

        // Save photo
        String photoPath = photoStorageService.savePhoto(
                request.getPhotoBase64(),
                safeCode(employee));

        LocalDateTime checkOutTime = LocalDateTime.now();
        attendance.setCheckOutTime(checkOutTime);
        attendance.setCheckOutLatitude(request.getLatitude());
        attendance.setCheckOutLongitude(request.getLongitude());
        attendance.setCheckOutLocation(request.getLocationLabel());
        attendance.setCheckOutPhotoUrl(photoPath);
        if (request.getNotes() != null) {
            attendance.setNotes(request.getNotes());
        }
        // Update device metadata if provided
        if (request.getIpAddress() != null) attendance.setIpAddress(request.getIpAddress());
        if (request.getDeviceInfo() != null) attendance.setDeviceInfo(request.getDeviceInfo());
        if (request.getUserAgent() != null)  attendance.setUserAgent(request.getUserAgent());

        // Auto-calculate work hours and overtime
        attendance.calculateWorkHours();

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Employee [{}] checked out at {} (workHours={}min)",
                employee.getEmployeeCode(), checkOutTime, saved.getWorkHours());
        return mapToResponse(saved);
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public com.company.ems.backend.common.dto.PageResponse<AttendanceResponse> getAttendance(
            int page, int size,
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            CustomUserPrincipal principal) {

        // Employees can only see their own records
        Long resolvedEmployeeId = resolveEmployeeIdForQuery(employeeId, principal);

        AttendanceStatus statusEnum = (status != null && !status.isBlank())
                ? AttendanceStatus.valueOf(status.toUpperCase())
                : null;

        Page<Attendance> pageResult = attendanceRepository.searchAttendances(
                resolvedEmployeeId, statusEnum, startDate, endDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date")));

        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryResponse getSummary(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            CustomUserPrincipal principal) {

        Long resolvedEmployeeId = resolveEmployeeIdForQuery(employeeId, principal);
        Employee employee = employeeRepository.findById(resolvedEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", resolvedEmployeeId));

        LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to   = endDate   != null ? endDate   : LocalDate.now();

        long present  = attendanceRepository.countByEmployeeAndStatusAndDateBetween(
                employee, AttendanceStatus.PRESENT, from, to);
        long late     = attendanceRepository.countByEmployeeAndStatusAndDateBetween(
                employee, AttendanceStatus.LATE, from, to);
        long absent   = attendanceRepository.countByEmployeeAndStatusAndDateBetween(
                employee, AttendanceStatus.ABSENT, from, to);
        long halfDay  = attendanceRepository.countByEmployeeAndStatusAndDateBetween(
                employee, AttendanceStatus.HALF_DAY, from, to);

        long totalDays = from.until(to).getDays() + 1;
        double percentage = totalDays > 0
                ? ((present + late + halfDay) / (double) totalDays) * 100.0
                : 0.0;

        Long totalWorkMinutes = attendanceRepository.calculateTotalWorkHours(employee, from, to);

        return AttendanceSummaryResponse.builder()
                .employeeId(resolvedEmployeeId)
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .totalDays((int) totalDays)
                .presentDays((int) present)
                .absentDays((int) absent)
                .lateDays((int) late)
                .halfDays((int) halfDay)
                .attendancePercentage(Math.round(percentage * 10.0) / 10.0)
                .totalWorkHours(totalWorkMinutes != null ? (int) (totalWorkMinutes / 60) : 0)
                .build();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Employee resolveEmployee(CustomUserPrincipal principal) {
        return employeeRepository.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee record không tồn tại cho userId: " + principal.getUserId()));
    }

    /**
     * For EMPLOYEE role, always return their own employee ID.
     * For MANAGER/HR/ADMIN roles, honour the provided {@code employeeId} param.
     */
    private Long resolveEmployeeIdForQuery(Long requestedEmployeeId, CustomUserPrincipal principal) {
        boolean isEmployee = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ROLE_EMPLOYEE")
                            || a.getAuthority().equals("ROLE_EMPLOYEE"));
        if (isEmployee) {
            Employee e = resolveEmployee(principal);
            return e.getId();
        }
        return requestedEmployeeId; // null means "all" for managers
    }

    private String safeCode(Employee employee) {
        return employee.getEmployeeCode() != null ? employee.getEmployeeCode() : String.valueOf(employee.getId());
    }

    private AttendanceResponse mapToResponse(Attendance a) {
        if (a == null) return null;
        String empName = null;
        String empCode = null;
        if (a.getEmployee() != null) {
            empName = a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName();
            empCode = a.getEmployee().getEmployeeCode();
        }
        return AttendanceResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployee() != null ? a.getEmployee().getId() : null)
                .employeeName(empName)
                .employeeCode(empCode)
                .date(a.getDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .checkInMethod(a.getCheckInMethod() != null ? a.getCheckInMethod().name() : null)
                .workHours(a.getWorkHours())
                .workHoursDecimal(a.getWorkHoursDecimal())
                .isLate(a.getIsLate())
                .isOvertime(a.getIsOvertime())
                .overtimeMinutes(a.getOvertimeMinutes())
                .checkInLatitude(a.getCheckInLatitude())
                .checkInLongitude(a.getCheckInLongitude())
                .checkInLocation(a.getCheckInLocation())
                .checkOutLatitude(a.getCheckOutLatitude())
                .checkOutLongitude(a.getCheckOutLongitude())
                .checkOutLocation(a.getCheckOutLocation())
                .checkInPhotoUrl(a.getCheckInPhotoUrl())
                .checkOutPhotoUrl(a.getCheckOutPhotoUrl())
                .notes(a.getNotes())
                .isRemote(a.getIsRemote())
                .approvedByName(a.getApprovedBy() != null ? a.getApprovedBy().getUsername() : null)
                .approvedAt(a.getApprovedAt())
                .approvalNotes(a.getApprovalNotes())
                .build();
    }
}
