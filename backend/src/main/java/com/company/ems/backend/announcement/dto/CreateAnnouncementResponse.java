package com.company.ems.backend.announcement.dto;

import java.time.LocalDateTime;

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
public class CreateAnnouncementResponse {
    private Long announcementId;
    private Integer recipientCount;
    private LocalDateTime publishedAt;
}
