package com.company.ems.backend.announcement.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.announcement.entity.Announcement;
import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;

@ExtendWith(MockitoExtension.class)
class AnnouncementRepositoryTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Test
    void save_shouldReturnPersistedAnnouncement() {
        Announcement announcement = Announcement.builder()
                .title("Policy")
                .content("Updated policy")
                .announcementType(AnnouncementType.POLICY)
                .targetAudience(TargetAudience.ALL_COMPANY)
                .publishedAt(LocalDateTime.now())
                .build();

        announcement.setId(100L);
        when(announcementRepository.save(announcement)).thenReturn(announcement);

        Announcement saved = announcementRepository.save(announcement);

        assertEquals(100L, saved.getId());
        assertEquals("Policy", saved.getTitle());
        assertEquals(AnnouncementType.POLICY, saved.getAnnouncementType());
    }
}
