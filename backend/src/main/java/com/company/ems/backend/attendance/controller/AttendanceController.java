package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "Attendance Management", description = "APIs for managing employee attendance and check-in/check-out")
@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    @Operation(summary = "Check-in/Check-out", description = "Record employee attendance check-in or check-out")
    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request) {
        // TODO: Implement check-in service
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Check-in successful", null));
    }

    @Operation(summary = "Get attendance records", description = "Retrieve attendance records with filtering and pagination")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> getAttendance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        // TODO: Implement get attendance service
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "Get attendance summary", description = "Get attendance summary statistics for employee(s)")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AttendanceSummaryResponse>> getAttendanceSummary(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        // TODO: Implement attendance summary service
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
