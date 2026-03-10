package com.company.ems.backend.department.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.department.entity.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
