package com.company.ems.backend.department.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.employee.entity.Employee;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Department entity representing organizational departments
 * Supports hierarchical structure with parent-child relationships
 */
@Entity
@Table(name = "departments", indexes = {
        @Index(name = "idx_department_code", columnList = "code", unique = true),
        @Index(name = "idx_department_parent", columnList = "parent_department_id"),
        @Index(name = "idx_department_status", columnList = "isActive")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department extends BaseEntity {

    @NotBlank(message = "Department code is required")
    @Size(max = 50, message = "Department code must not exceed 50 characters")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "head_of_department_id")
    private Employee headOfDepartment;

    @Column(precision = 15, scale = 2)
    private BigDecimal budgetAllocation;

    @Size(max = 100, message = "Location must not exceed 100 characters")
    @Column(length = 100)
    private String location;

    @Size(max = 50, message = "Cost center must not exceed 50 characters")
    @Column(length = 50)
    private String costCenter;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    @Column(length = 1000)
    private String notes;

    // Relationship: One Department has Many sub-departments
    @OneToMany(mappedBy = "parentDepartment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Department> subDepartments = new ArrayList<>();

    // Relationship: One Department has Many employees
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Employee> employees = new ArrayList<>();

    /**
     * Add a sub-department
     */
    public void addSubDepartment(Department subDepartment) {
        subDepartments.add(subDepartment);
        subDepartment.setParentDepartment(this);
    }

    /**
     * Remove a sub-department
     */
    public void removeSubDepartment(Department subDepartment) {
        subDepartments.remove(subDepartment);
        subDepartment.setParentDepartment(null);
    }

    /**
     * Check if this is a root department (no parent)
     */
    public boolean isRootDepartment() {
        return parentDepartment == null;
    }

    /**
     * Get department hierarchy level (0 for root, 1 for first level, etc.)
     */
    public int getHierarchyLevel() {
        if (parentDepartment == null) {
            return 0;
        }
        return 1 + parentDepartment.getHierarchyLevel();
    }

    /**
     * Get full department path (e.g., "IT > Development > Backend")
     */
    public String getFullPath() {
        if (parentDepartment == null) {
            return name;
        }
        return parentDepartment.getFullPath() + " > " + name;
    }

    /**
     * Deactivate department
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * Activate department
     */
    public void activate() {
        this.isActive = true;
    }
}
