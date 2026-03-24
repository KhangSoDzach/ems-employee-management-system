package com.company.ems.backend.attendance.service;

import java.time.LocalDate;

import com.company.ems.backend.attendance.dto.AttendanceCalendarResponse;
import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.CheckInRequest;
import com.company.ems.backend.attendance.dto.CheckOutRequest;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;

/**
 * Service interface for employee check-in / check-out operations and
 * attendance record queries.
 */
public interface AttendanceService {

    /**
     * Records a check-in for the currently authenticated employee.
     *
     * <p>Validates:
     * <ol>
     *   <li>Employee does not already have a check-in record for today.
     *   <li>Provided coordinates are within the configured office radius (Haversine).
     *   <li>{@code photoBase64} is non-empty and can be decoded.
     * </ol>
     *
     * @param request   check-in payload (lat, lon, photo, method, notes)
     * @param principal the authenticated user's principal
     * @return the created attendance record as a response DTO
     */
    AttendanceResponse checkIn(CheckInRequest request, CustomUserPrincipal principal);

    /**
     * Records a check-out for the currently authenticated employee.
     *
     * <p>Validates:
     * <ol>
     *   <li>An active (no check-out) attendance record exists for today.
     *   <li>Provided coordinates are within the configured office radius (Haversine).
     *   <li>{@code photoBase64} is non-empty and can be decoded.
     * </ol>
     *
     * @param request   check-out payload (lat, lon, photo, notes)
     * @param principal the authenticated user's principal
     * @return the updated attendance record as a response DTO
     */
    AttendanceResponse checkOut(CheckOutRequest request, CustomUserPrincipal principal);

    /**
     * Returns a paginated list of attendance records.
     *
     * @param page       zero-based page number
     * @param size       page size
     * @param employeeId filter by employee; if {@code null} the scope is determined by the caller's role
     * @param startDate  optional lower bound (inclusive)
     * @param endDate    optional upper bound (inclusive)
     * @param status     optional {@link com.company.ems.backend.attendance.enums.AttendanceStatus} name filter
     * @param principal  the authenticated user's principal (used for data-scope enforcement)
     */
    PageResponse<AttendanceResponse> getAttendance(
            int page, int size,
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            CustomUserPrincipal principal);

    /**
     * Returns a summary (total days, present, absent, late, …) for the given employee and date range.
     *
     * @param employeeId the employee to summarise; if {@code null} uses the principal's employee
     * @param startDate  period start (inclusive, defaults to start of the current month if null)
     * @param endDate    period end (inclusive, defaults to today if null)
     * @param principal  the authenticated user's principal
     */
    AttendanceSummaryResponse getSummary(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            CustomUserPrincipal principal);

    /**
     * Returns monthly calendar data with summary cards and trend versus previous month.
     *
     * @param employeeId optional employee id (admins/managers may view others)
     * @param month      target month in yyyy-MM format
     * @param principal  authenticated principal
     */
    AttendanceCalendarResponse getMonthlyCalendar(
            Long employeeId,
            String month,
            CustomUserPrincipal principal);
}
