package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    /**
     * Check-in/Check-out for attendance
     * POST /api/v1/attendance/check-in
     */
    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request) {
        // TODO: Implement check-in service
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Check-in successful", null));
    }

    /**
     * Get attendance records with filtering and pagination
     * GET /api/v1/attendance
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> getAttendance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        // TODO: Implement get attendance service
        return ResponseEntity.ok(ApiResponse.success("success", null));
    }

    /**
     * Get attendance summary for employee(s)
     * GET /api/v1/attendance/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AttendanceSummaryResponse>> getAttendanceSummary(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        // TODO: Implement attendance summary service
        return ResponseEntity.ok(ApiResponse.success("success",null));
    }
}
