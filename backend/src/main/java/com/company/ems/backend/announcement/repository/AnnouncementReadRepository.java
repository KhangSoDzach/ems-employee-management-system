package com.company.ems.backend.announcement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.announcement.entity.AnnouncementRead;

@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, Long> {

    @Query("""
            SELECT ar
            FROM AnnouncementRead ar
            JOIN FETCH ar.announcement a
            WHERE ar.user.id = :userId
              AND ar.isDeleted = false
              AND a.isDeleted = false
            ORDER BY a.publishedAt DESC
            """)
    List<AnnouncementRead> findVisibleByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT ar
            FROM AnnouncementRead ar
            WHERE ar.announcement.id = :announcementId
              AND ar.user.id = :userId
              AND ar.isDeleted = false
            """)
    Optional<AnnouncementRead> findByAnnouncementAndUser(
            @Param("announcementId") Long announcementId,
            @Param("userId") Long userId);
}
