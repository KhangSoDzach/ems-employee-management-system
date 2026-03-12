package com.company.ems.backend.attendance.repository;

import com.company.ems.backend.attendance.entity.OfficeLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficeLocationRepository extends JpaRepository<OfficeLocation, Long> {
    List<OfficeLocation> findByIsActiveTrue();
}
