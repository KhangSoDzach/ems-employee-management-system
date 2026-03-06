package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.attendance.dto.CheckOutRequest;
import com.company.ems.backend.attendance.service.AttendanceService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.rbac.service.DataScopeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST controller for attendance check-in / check-out and record queries.
 *
 * <p>
 * All endpoints require authentication. The employee identity is resolved
 * server-side from the JWT principal — clients must NOT send
 * {@code employeeId}.
 */
@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Employee check-in / check-out operations")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final DataScopeService dataScopeService;

    // ─── Check-in ─────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/attendance/check-in
     *
     * <p>
     * Requires: ATTENDANCE_CHECKIN permission.
     * Validates geolocation (≤30 m from office) and camera photo server-side.
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('ATTENDANCE_CHECKIN')")
    @Operation(summary = "Check in with camera & geolocation")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            HttpServletRequest httpRequest) {

        // Inject server-side metadata (client cannot forge these)
        request.setIpAddress(extractClientIp(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));
        request.setDeviceInfo(httpRequest.getHeader("X-Device-Info")); // optional custom header

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AttendanceResponse response = attendanceService.checkIn(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Check-in thành công.", response));
    }

    // ─── Check-out ────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/attendance/check-out
     *
     * <p>
     * Requires: ATTENDANCE_CHECKIN permission.
     */
    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('ATTENDANCE_CHECKIN')")
    @Operation(summary = "Check out with camera & geolocation")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @Valid @RequestBody CheckOutRequest request,
            HttpServletRequest httpRequest) {

        request.setIpAddress(extractClientIp(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));
        request.setDeviceInfo(httpRequest.getHeader("X-Device-Info"));

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AttendanceResponse response = attendanceService.checkOut(request, principal);
        return ResponseEntity.ok(ApiResponse.success("Check-out thành công.", response));
    }

    // ─── Queries──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/attendance
     *
     * <p>
     * Employees see only their own records; Managers/HR/Admin can filter by
     * {@code employeeId}.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_READ')")
    @Operation(summary = "List attendance records (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> getAttendance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        PageResponse<AttendanceResponse> result =
                attendanceService.getAttendance(page, size, employeeId, startDate, endDate, status, principal);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/v1/attendance/summary
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ATTENDANCE_READ')")
    @Operation(summary = "Get attendance summary for an employee")
    public ResponseEntity<ApiResponse<AttendanceSummaryResponse>> getAttendanceSummary(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AttendanceSummaryResponse summary =
                attendanceService.getSummary(employeeId, startDate, endDate, principal);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private String extractClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
