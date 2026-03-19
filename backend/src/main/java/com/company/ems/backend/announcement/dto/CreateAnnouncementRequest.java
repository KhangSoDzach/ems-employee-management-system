package com.company.ems.backend.announcement.dto;

import java.util.List;

import com.company.ems.backend.announcement.enums.AnnouncementType;
import com.company.ems.backend.announcement.enums.TargetAudience;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateAnnouncementRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Announcement type is required")
    private AnnouncementType announcementType;

    @NotNull(message = "Target audience is required")
    private TargetAudience targetAudience;

    @NotNull(message = "Target IDs are required")
    @Builder.Default
    private List<Long> targetIds = java.util.Collections.emptyList();

    public boolean requiresTargetIds() {
        return TargetAudience.BY_DEPARTMENT.equals(targetAudience) || TargetAudience.BY_ROLE.equals(targetAudience);
    }

    public void validateTargetIds() {
        if (requiresTargetIds() && (targetIds == null || targetIds.isEmpty())) {
            throw new jakarta.validation.ValidationException("Target IDs are required for selected target audience");
        }
    }
}
