package com.company.ems.backend.employee.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Employee entity representing employee information
 * Core business entity with relationships to User, Attendance, and Leave
 */
@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employee_email", columnList = "email", unique = true),
        @Index(name = "idx_employee_status", columnList = "status"),
        @Index(name = "idx_employee_department", columnList = "department"),
        @Index(name = "idx_employee_hire_date", columnList = "hireDate")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee extends BaseEntity {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Column(length = 20)
    private String phone;

    @NotNull(message = "Date of birth is required")
    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @NotNull(message = "Hire date is required")
    @Column(nullable = false)
    private LocalDate hireDate;

    @NotBlank(message = "Position is required")
    @Size(max = 100, message = "Position must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String position;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String department;

    @NotNull(message = "Salary is required")
    @Column(nullable = false)
    private Double salary;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    @Column(length = 255)
    private String address;

    @Size(max = 100, message = "City must not exceed 100 characters")
    @Column(length = 100)
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    @Column(length = 100)
    private String state;

    @Size(max = 20, message = "Zip code must not exceed 20 characters")
    @Column(length = 20)
    private String zipCode;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    @Column(length = 100)
    private String country;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, TERMINATED

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    @Column(length = 500)
    private String avatarUrl;

    @Size(max = 50, message = "Employee code must not exceed 50 characters")
    @Column(length = 50, unique = true)
    private String employeeCode;

    @Column
    private LocalDate terminationDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Column(length = 1000)
    private String notes;

    // Relationship: One Employee has One User account (optional)
    @OneToOne(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // Relationship: One Employee has Many Attendances
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Attendance> attendances = new ArrayList<>();

    // Relationship: One Employee has Many Leaves
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Leave> leaves = new ArrayList<>();

    /**
     * Get full name of employee
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }

    /**
     * Add attendance record
     */
    public void addAttendance(Attendance attendance) {
        attendances.add(attendance);
        attendance.setEmployee(this);
    }

    /**
     * Remove attendance record
     */
    public void removeAttendance(Attendance attendance) {
        attendances.remove(attendance);
        attendance.setEmployee(null);
    }

    /**
     * Add leave request
     */
    public void addLeave(Leave leave) {
        leaves.add(leave);
        leave.setEmployee(this);
    }

    /**
     * Remove leave request
     */
    public void removeLeave(Leave leave) {
        leaves.remove(leave);
        leave.setEmployee(null);
    }

    /**
     * Check if employee is active
     */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    /**
     * Terminate employee
     */
    public void terminate(LocalDate terminationDate) {
        this.status = "TERMINATED";
        this.terminationDate = terminationDate;
    }
}
