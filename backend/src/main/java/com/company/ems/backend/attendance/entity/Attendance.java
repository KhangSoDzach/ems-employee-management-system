package com.company.ems.backend.attendance.entity;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.company.ems.backend.attendance.enums.AttendanceStatus;
import com.company.ems.backend.attendance.enums.CheckInMethod;
import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Attendance entity for tracking employee check-in and check-out
 * Records daily attendance with timestamps and location data
 */
@Entity
@Table(name = "attendances", indexes = {
        // @Index(name = "idx_attendance_employee", columnList = "employee_id"),
        // @Index(name = "idx_attendance_date", columnList = "date"),
        @Index(name = "idx_attendance_status", columnList = "status"),
        @Index(name = "idx_attendance_employee_date", columnList = "employee_id, date", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attendance extends BaseEntity {

    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Date is required")
    @Column(nullable = false)
    private LocalDate date;

    @NotNull(message = "Check-in time is required")
    @Column(nullable = false)
    private LocalDateTime checkInTime;

    @Column
    private LocalDateTime checkOutTime;

    @Column(length = 255)
    private String checkInLocation;

    @Column(length = 255)
    private String checkOutLocation;

    @Column
    private Double checkInLatitude;

    @Column
    private Double checkInLongitude;

    @Column
    private Double checkOutLatitude;

    @Column
    private Double checkOutLongitude;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(length = 1000)
    private String notes;

    @Column
    private Integer workHours; // Total work hours in minutes

    @Column
    private Integer breakTime; // Break time in minutes

    @Column
    @Builder.Default
    private Boolean isLate = false;

    @Column
    @Builder.Default
    private Boolean isOvertime = false;

    @Column
    private Integer overtimeMinutes;

    // New fields for enhanced attendance tracking
    @Column(length = 50)
    private String ipAddress;

    @Column(length = 255)
    private String deviceInfo;

    @Column(length = 500)
    private String userAgent;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRemote = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CheckInMethod checkInMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column
    private LocalDateTime approvedAt;

    @Column(length = 500)
    private String approvalNotes;

    /**
     * Calculate total work hours between check-in and check-out
     */
    public void calculateWorkHours() {
        if (checkInTime != null && checkOutTime != null) {
            Duration duration = Duration.between(checkInTime, checkOutTime);
            this.workHours = (int) duration.toMinutes();

            // Subtract break time if set
            if (breakTime != null && breakTime > 0) {
                this.workHours -= breakTime;
            }

            // Calculate overtime (assuming standard 8 hours = 480 minutes)
            int standardWorkMinutes = 480;
            if (this.workHours > standardWorkMinutes) {
                this.isOvertime = true;
                this.overtimeMinutes = this.workHours - standardWorkMinutes;
            }
        }
    }

    /**
     * Check if employee checked out
     */
    public boolean isCheckedOut() {
        return checkOutTime != null;
    }

    /**
     * Get work hours in decimal format (e.g., 8.5 hours)
     */
    public Double getWorkHoursDecimal() {
        if (workHours == null) {
            return 0.0;
        }
        return workHours / 60.0;
    }

    // @PrePersist
    // @PreUpdate
    // private void beforeSave() {
    //     calculateWorkHours();
    // }
}
