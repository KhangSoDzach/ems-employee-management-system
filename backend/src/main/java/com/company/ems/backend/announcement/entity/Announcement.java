package com.company.ems.backend.announcement.entity;

import java.time.LocalDateTime;

import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;
import com.company.ems.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "announcements", indexes = {
        @Index(name = "idx_announcements_type", columnList = "announcementType"),
        @Index(name = "idx_announcements_target_audience", columnList = "targetAudience"),
        @Index(name = "idx_announcements_published_at", columnList = "publishedAt")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Announcement extends BaseEntity {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Column(nullable = false, length = 255)
    private String title;

    @NotBlank(message = "Content is required")
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @NotNull(message = "Announcement type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementType announcementType;

    @NotNull(message = "Target audience is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TargetAudience targetAudience;

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailDeliveryRequested = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer emailedRecipientCount = 0;

    @Column(nullable = false)
    private LocalDateTime publishedAt;
}
