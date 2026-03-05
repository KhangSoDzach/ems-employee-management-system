package com.company.ems.backend.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO returned by check-in, check-out, and attendance list endpoints. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long            id;

    // Employee info
    private Long            employeeId;
    private String          employeeName;
    private String          employeeCode;

    // Core attendance data
    private LocalDate       date;
    private LocalDateTime   checkInTime;
    private LocalDateTime   checkOutTime;
    private String          status;         // PRESENT, LATE, ABSENT, etc.
    private String          checkInMethod;  // WEB, CAMERA_GEO, MANUAL, ...

    // Work hours
    private Integer         workHours;      // stored in minutes
    private Double          workHoursDecimal;
    private Boolean         isLate;
    private Boolean         isOvertime;
    private Integer         overtimeMinutes;

    // Location
    private String          checkInLocation;
    private Double          checkInLatitude;
    private Double          checkInLongitude;
    private String          checkOutLocation;
    private Double          checkOutLatitude;
    private Double          checkOutLongitude;

    // Photos (relative paths served by the backend)
    private String          checkInPhotoUrl;
    private String          checkOutPhotoUrl;

    // Misc
    private String          notes;
    private Boolean         isRemote;

    // Approval
    private String          approvedByName;
    private LocalDateTime   approvedAt;
    private String          approvalNotes;
}
