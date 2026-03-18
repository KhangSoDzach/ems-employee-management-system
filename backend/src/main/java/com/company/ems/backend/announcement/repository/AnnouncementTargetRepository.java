package com.company.ems.backend.announcement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.announcement.entity.AnnouncementTarget;

@Repository
public interface AnnouncementTargetRepository extends JpaRepository<AnnouncementTarget, Long> {
}
