package com.company.ems.backend.rbac.service;

import org.springframework.data.jpa.domain.Specification;
import com.company.ems.backend.employee.entity.Employee;

public interface DataScopeService {

    boolean canAccessEmployee(Long targetEmployeeId);

    boolean isInManagerTeam(Long targetEmployeeId);

    boolean isSelfEmployee(Long targetEmployeeId);

    Specification<Employee> buildScopeSpec();
}