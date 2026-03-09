package com.company.ems.backend.asset.incident.dto;

import com.company.ems.backend.asset.incident.entity.IncidentType;
import com.company.ems.backend.common.validation.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

public class IncidentDto {

    @Data
    public static class SubmitRequest {
        @NotNull(message = ValidationMessages.INCIDENT_TYPE_REQUIRED)
        private IncidentType incidentType;

        @NotBlank(message = ValidationMessages.DESCRIPTION_REQUIRED)
        @Size(min = 10, max = 2000, message = ValidationMessages.DESCRIPTION_SIZE)
        private String description;
    }

    @Data
    @Builder
    public static class ReportRow {
        private Long id;
        private String reportId;
        private String asset;
        private String assetTag;
        private String issueType;
        private String dateReported;
        private String status;
        private String statusLabel;
        private String statusColor;
    }

    @Data
    @Builder
    public static class ReportDetail {
        private Long id;
        private String reportId;
        private String asset;
        private String assetCode;
        private String assetTag;
        private String incidentType;
        private String incidentTypeLabel;
        private String description;
        private String attachmentUrl;
        private String status;
        private String statusLabel;
        private String statusColor;
        private String reportedBy;
        private String reportedAt;
        private String processedBy;
        private String processedAt;
        private String processNote;
        private String assetCondition;
        private String assetStatus;
    }

    @Data
    @Builder
    public static class MyAsset {
        private Long id;
        private String name;
        private String tag;
        private String assetType;
        private String imageUrl;
    }

    @Data
    public static class ProcessRequest {
        @Size(max = 500)
        private String note;
    }

    @Data
    @Builder
    public static class AdminListItem {
        private Long id;
        private String reportId;
        private String asset;
        private String employeeName;
        private String issueType;
        private String issueTypeLabel;
        private String reportedAt;
        private String status;
        private String statusLabel;
        private String statusColor;
    }
}