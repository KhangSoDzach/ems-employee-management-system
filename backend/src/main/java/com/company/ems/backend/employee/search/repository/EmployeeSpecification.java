package com.company.ems.backend.employee.search.repository;

import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;


public class EmployeeSpecification {

    private EmployeeSpecification() {}

    public static Specification<Employee> notDeleted() {
        return (root, query, cb) ->
                cb.or(
                        cb.isFalse(root.get("isDeleted")),
                        cb.isNull(root.get("isDeleted"))
                );
    }

    public static Specification<Employee> inManagerTeam(Long managerUserId) {
        return (root, query, cb) -> {
            // JOIN employees.reportingManager rm → JOIN rm.user u
            var managerJoin = root.join("reportingManager", JoinType.INNER);
            var userJoin    = managerJoin.join("user", JoinType.INNER);
            return cb.equal(userJoin.get("id"), managerUserId);
        };
    }

    public static Specification<Employee> keywordSearch(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Specification.where(null); // No-op
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            // fullName = CONCAT(firstName, ' ', lastName)
            var fullName = cb.lower(
                    cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"))
            );
            return cb.or(
                    cb.like(cb.lower(root.get("employeeCode")), pattern),
                    cb.like(fullName, pattern),
                    cb.like(cb.lower(root.get("email")), pattern)
            );
        };
    }

    public static Specification<Employee> byDepartment(String departmentNameOrCode) {
        if (departmentNameOrCode == null || departmentNameOrCode.isBlank()) {
            return Specification.where(null);
        }
        String val = departmentNameOrCode.trim();
        return (root, query, cb) -> {
            var deptJoin = root.join("department", JoinType.LEFT);
            return cb.or(
                    cb.equal(cb.lower(deptJoin.get("name")), val.toLowerCase()),
                    cb.equal(cb.lower(deptJoin.get("code")), val.toLowerCase())
            );
        };
    }

    public static Specification<Employee> byStatus(EmployeeStatus status) {
        if (status == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Employee> searchCriteria(
            String keyword, String department, EmployeeStatus status) {
        return Specification
                .where(notDeleted())
                .and(keywordSearch(keyword))
                .and(byDepartment(department))
                .and(byStatus(status));
    }
}