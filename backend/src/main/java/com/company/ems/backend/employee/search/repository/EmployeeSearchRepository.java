package com.company.ems.backend.employee.search.repository;

import com.company.ems.backend.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public interface EmployeeSearchRepository
        extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
}