package com.company.ems.backend.performance.review.repository;

import com.company.ems.backend.performance.review.entity.OneOnOneMeeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OneOnOneMeetingRepository extends JpaRepository<OneOnOneMeeting, Long> {

    @Query("""
        SELECT m FROM OneOnOneMeeting m
        WHERE m.employeeId = :employeeId
          AND (m.isDeleted IS NULL OR m.isDeleted = false)
        ORDER BY m.meetingDate DESC
    """)
    Page<OneOnOneMeeting> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);

    @Query("""
        SELECT m FROM OneOnOneMeeting m
        WHERE m.managerId = :managerId
          AND (m.isDeleted IS NULL OR m.isDeleted = false)
        ORDER BY m.meetingDate DESC
    """)
    Page<OneOnOneMeeting> findByManagerId(@Param("managerId") Long managerId, Pageable pageable);

    @Query("""
        SELECT m FROM OneOnOneMeeting m
        WHERE m.managerId = :managerId
          AND m.employeeId = :employeeId
          AND (m.isDeleted IS NULL OR m.isDeleted = false)
        ORDER BY m.meetingDate DESC
    """)
    Page<OneOnOneMeeting> findByManagerIdAndEmployeeId(
            @Param("managerId") Long managerId,
            @Param("employeeId") Long employeeId,
            Pageable pageable);
}