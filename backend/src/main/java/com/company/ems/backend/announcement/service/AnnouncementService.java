package com.company.ems.backend.announcement.service;

import java.util.List;

import com.company.ems.backend.announcement.dto.AnnouncementResponse;
import com.company.ems.backend.announcement.dto.CreateAnnouncementRequest;
import com.company.ems.backend.announcement.dto.CreateAnnouncementResponse;

public interface AnnouncementService {

    CreateAnnouncementResponse createAnnouncement(CreateAnnouncementRequest request);

    List<AnnouncementResponse> getAnnouncementsForUser(Long userId);

    AnnouncementResponse markAnnouncementAsRead(Long announcementId, Long userId);
}
