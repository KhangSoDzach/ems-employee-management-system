package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.attendance.dto.CheckOutRequest;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
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

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Employee check-in / check-out operations")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService  attendanceService;
    private final DataScopeService   dataScopeService;
    private final MessageService      messages;

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('ATTENDANCE_CHECKIN')")
    @Operation(summary = "Check in with camera & geolocation")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            HttpServletRequest httpRequest) {
        request.setIpAddress(extractClientIp(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));
        request.setDeviceInfo(httpRequest.getHeader("X-Device-Info")); // optional custom header

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        AttendanceResponse response   = attendanceService.checkIn(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.ATTENDANCE_CHECKIN_SUCCESS), response));
    }

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
        AttendanceResponse response   = attendanceService.checkOut(request, principal);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.ATTENDANCE_CHECKOUT_SUCCESS), response));
    }

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
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), result));
    }

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
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), summary));
    }
    private String extractClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}