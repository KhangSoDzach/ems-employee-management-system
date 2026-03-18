package com.company.ems.backend.announcement.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String content;
    private AnnouncementType announcementType;
    private TargetAudience targetAudience;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime publishedAt;
}
