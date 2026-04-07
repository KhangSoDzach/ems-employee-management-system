package com.company.ems.backend.payroll.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.payroll.entity.SalaryComponent;

@Repository
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, Long> {

    List<SalaryComponent> findAllByIsDeletedFalseOrderByCreatedAtDesc();

    Optional<SalaryComponent> findByIdAndIsDeletedFalse(Long id);

    boolean existsByCodeIgnoreCaseAndIsDeletedFalse(String code);

    boolean existsByNameIgnoreCaseAndIsDeletedFalse(String name);

    boolean existsByCodeIgnoreCaseAndIdNotAndIsDeletedFalse(String code, Long id);

    boolean existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(String name, Long id);
}
