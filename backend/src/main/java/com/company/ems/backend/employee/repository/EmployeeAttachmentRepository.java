package com.company.ems.backend.employee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.ems.backend.employee.entity.EmployeeAttachment;

public interface EmployeeAttachmentRepository extends JpaRepository<EmployeeAttachment, Long> {
    List<EmployeeAttachment> findByEmployeeIdAndIsDeletedFalseOrderByCreatedAtDesc(Long employeeId);

    Optional<EmployeeAttachment> findByIdAndEmployeeIdAndIsDeletedFalse(Long id, Long employeeId);
}
