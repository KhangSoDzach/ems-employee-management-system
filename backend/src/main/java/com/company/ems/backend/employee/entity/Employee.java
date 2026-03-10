package com.company.ems.backend.employee.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.employee.enums.ContractType;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.enums.Gender;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.position.entity.Position;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
        @Index(name = "idx_employee_department", columnList = "department_id"),
        @Index(name = "idx_employee_position", columnList = "position_id"),
        @Index(name = "idx_employee_hire_date", columnList = "hireDate"),
        @Index(name = "idx_employee_manager", columnList = "reporting_manager_id")
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

    // Department and Position - Changed from String to FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

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

    // Employment Status - Changed from String to Enum
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    // Emergency Contact Information
    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
    @Column(length = 100)
    private String emergencyContactName;

    @Size(max = 20, message = "Emergency contact phone must not exceed 20 characters")
    @Column(length = 20)
    private String emergencyContactPhone;

    @Size(max = 50, message = "Emergency contact relation must not exceed 50 characters")
    @Column(length = 50)
    private String emergencyContactRelation;

    // Government & Tax Information
    @Size(max = 50, message = "Tax ID must not exceed 50 characters")
    @Column(length = 50)
    private String taxId; // TODO: Add encryption

    @Size(max = 50, message = "Social security number must not exceed 50 characters")
    @Column(length = 50)
    private String socialSecurityNumber; // TODO: Add encryption

    @Size(max = 50, message = "National ID must not exceed 50 characters")
    @Column(length = 50)
    private String nationalId;

    // Banking Information
    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    @Column(length = 50)
    private String bankAccountNumber; // TODO: Add encryption

    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    @Column(length = 100)
    private String bankName;

    @Size(max = 100, message = "Bank branch must not exceed 100 characters")
    @Column(length = 100)
    private String bankBranch;

    // Employment Details
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private Employee reportingManager;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ContractType contractType;

    @Column
    private LocalDate probationEndDate;

    @Column
    private LocalDate contractEndDate;

    @Size(max = 100, message = "Work location must not exceed 100 characters")
    @Column(length = 100)
    private String workLocation;

    // Personal Information
    @Size(max = 50, message = "Nationality must not exceed 50 characters")
    @Column(length = 50)
    private String nationality;

    @Size(max = 10, message = "Blood group must not exceed 10 characters")
    @Column(length = 10)
    private String bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender;

    // Leave Balance Information (denormalized for quick access)
    @Column
    @Builder.Default
    private Integer annualLeaveBalance = 0;

    @Column
    @Builder.Default
    private Integer sickLeaveBalance = 0;

    // Salary
    @Column(name = "salary", columnDefinition = "DECIMAL(15,2) DEFAULT 0.00")
    @Builder.Default
    private Double salary = 0.0;

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
    @OneToOne(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
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
        return EmployeeStatus.ACTIVE.equals(status);
    }

    /**
     * Check if employee is on probation
     */
    public boolean isOnProbation() {
        return EmployeeStatus.ON_PROBATION.equals(status);
    }

    /**
     * Activate employee
     */
    public void activate() {
        this.status = EmployeeStatus.ACTIVE;
    }

    /**
     * Put employee on probation
     */
    public void putOnProbation(LocalDate probationEndDate) {
        this.status = EmployeeStatus.ON_PROBATION;
        this.probationEndDate = probationEndDate;
    }

    /**
     * Terminate employee
     */
    public void terminate(LocalDate terminationDate) {
        this.status = EmployeeStatus.TERMINATED;
        this.terminationDate = terminationDate;
    }

    /**
     * Mark employee as resigned
     */
    public void resign(LocalDate terminationDate) {
        this.status = EmployeeStatus.RESIGNED;
        this.terminationDate = terminationDate;
    }

    /**
     * Get emergency contact info as formatted string
     */
    public String getEmergencyContactInfo() {
        if (emergencyContactName == null) {
            return "Not provided";
        }
        return String.format("%s (%s) - %s",
                emergencyContactName,
                emergencyContactRelation != null ? emergencyContactRelation : "Unknown",
                emergencyContactPhone != null ? emergencyContactPhone : "No phone");
    }
}
