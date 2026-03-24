package com.company.ems.backend.asset.request.dto;

import com.company.ems.backend.asset.request.enums.RequestPriority;
import com.company.ems.backend.common.validation.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AssetRequestDto {

    private AssetRequestDto() {
        // hide implicit public constructor
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitRequest {
        @NotBlank(message = "Loại tài sản không được để trống")
        @Size(max = 100)
        private String assetType;

        @NotBlank(message = ValidationMessages.DESCRIPTION_REQUIRED)
        @Size(min = 10, max = 2000, message = ValidationMessages.DESCRIPTION_SIZE)
        private String reason;

        @NotNull(message = "Ưu tiên không được để trống")
        private RequestPriority priority;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestRow {
        private Long id;
        private String requestId;
        private String assetType;
        private String dateRequested;
        private String priority;
        private String priorityLabel;
        private String priorityColor;
        private String status;
        private String statusLabel;
        private String statusColor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestDetail {
        private Long id;
        private String requestId;
        private String assetType;
        private String priority;
        private String priorityLabel;
        private String priorityColor;
        private String reason;
        private String status;
        private String statusLabel;
        private String statusColor;
        private String requestedBy;
        private String requestedAt;
        private String reviewedBy;
        private String reviewedAt;
        private String reviewNote;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessRequest {
        @Size(max = 500)
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminListItem {
        private Long id;
        private String requestId;
        private String employeeName;
        private String assetType;
        private String priority;
        private String priorityLabel;
        private String priorityColor;
        private String requestedAt;
        private String status;
        private String statusLabel;
        private String statusColor;
    }
}
