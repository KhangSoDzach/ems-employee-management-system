package com.company.ems.backend.position.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.position.entity.Position;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    /**
     * Find all active positions with their department eagerly loaded (to avoid
     * LazyInitializationException)
     */
    @Query("SELECT p FROM Position p JOIN FETCH p.department WHERE p.isActive = true")
    List<Position> findAllActiveWithDepartment();

    /**
     * Find all active positions belonging to a specific department
     */
    @Query("SELECT p FROM Position p JOIN FETCH p.department d WHERE p.isActive = true AND d.id = :departmentId")
    List<Position> findAllActiveByDepartmentId(@Param("departmentId") Long departmentId);
}
