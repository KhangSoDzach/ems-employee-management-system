package com.company.ems.backend.position.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.employee.entity.Employee;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Position/Job Title entity representing job positions in the organization
 * Includes salary ranges, reporting structure, and career levels
 */
@Entity
@Table(name = "positions", indexes = {
        @Index(name = "idx_position_code", columnList = "code", unique = true),
        @Index(name = "idx_position_department", columnList = "department_id"),
        @Index(name = "idx_position_level", columnList = "level"),
        @Index(name = "idx_position_status", columnList = "isActive")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Position extends BaseEntity {

    @NotBlank(message = "Position code is required")
    @Size(max = 50, message = "Position code must not exceed 50 characters")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Position title is required")
    @Size(max = 100, message = "Position title must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Column(length = 2000)
    private String description;

    @Size(max = 2000, message = "Requirements must not exceed 2000 characters")
    @Column(length = 2000)
    private String requirements;

    @NotNull(message = "Department is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @NotNull(message = "Position level is required")
    @Min(value = 1, message = "Level must be between 1 and 10")
    @Max(value = 10, message = "Level must be between 1 and 10")
    @Column(nullable = false)
    private Integer level;

    @Column(precision = 15, scale = 2)
    private BigDecimal minSalary;

    @Column(precision = 15, scale = 2)
    private BigDecimal maxSalary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reports_to_position_id")
    private Position reportsTo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Column(length = 1000)
    private String notes;

    // Relationship: Position can have multiple subordinate positions
    @OneToMany(mappedBy = "reportsTo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Position> subordinatePositions = new ArrayList<>();

    // Relationship: One Position can have Many employees
    @OneToMany(mappedBy = "position", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Employee> employees = new ArrayList<>();

    /**
     * Check if salary is within range
     */
    public boolean isSalaryInRange(BigDecimal salary) {
        if (minSalary == null || maxSalary == null || salary == null) {
            return true;
        }
        return salary.compareTo(minSalary) >= 0 && salary.compareTo(maxSalary) <= 0;
    }

    /**
     * Get salary range as string
     */
    public String getSalaryRangeString() {
        if (minSalary == null || maxSalary == null) {
            return "Not specified";
        }
        return String.format("%.2f - %.2f", minSalary, maxSalary);
    }

    /**
     * Get position hierarchy level (0 for top position, 1 for first level, etc.)
     */
    public int getHierarchyLevel() {
        if (reportsTo == null) {
            return 0;
        }
        return 1 + reportsTo.getHierarchyLevel();
    }

    /**
     * Check if this is a leadership position (no reporting manager)
     */
    public boolean isLeadershipPosition() {
        return reportsTo == null;
    }

    /**
     * Deactivate position
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * Activate position
     */
    public void activate() {
        this.isActive = true;
    }
}
