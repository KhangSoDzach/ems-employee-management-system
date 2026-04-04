package com.company.ems.backend.asset.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.common.validation.ValidationMessages;
import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public final class AssetDto {

    private AssetDto() {}

    // ── Response DTOs ──────────────────────────────────────────────────────────

    @Data @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Summary {
        private Long dbId;         // numeric DB id — dùng cho GET/PUT/DELETE theo path variable
        private String id;          // assetCode — frontend dùng làm key
        private String name;
        private String desc;
        private String type;
        private String status;
        private String statusColor;
        private String user;
    }

    @Data @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Detail {
        private Long   id;          // numeric DB id — dùng cho PUT/DELETE
        private String name;
        private String code;
        private String type;
        private String value;
        private String purchaseDate;
        private String status;
        private String condition;
        private String warranty;
        private String supplier;
        private String contract;    // contractNumber — frontend dùng field này
        private String location;
        private String description;
        private String notes;
        private String imageUrl;
        private Long assignedToId;
        private List<HistoryItem> recentHistory;
    }

    @Data @Builder
    public static class HistoryItem {
        private Long   id;
        private String type;
        private String action;
        private String user;
        private String description;
        private String date;
    }

    @Data @Builder
    public static class CodePreview {
        private String nextCode;
    }

    // ── Request DTOs ───────────────────────────────────────────────────────────

    /**
     * Payload từ form "Thêm tài sản mới".
     * Frontend gửi dates ở ISO yyyy-MM-dd (từ <input type="date">).
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = ValidationMessages.ASSET_NAME_REQUIRED)
        @Size(max = 255)
        private String assetName;

        @Size(max = 100)
        private String assetType;

        @DecimalMin(value = "0.0", message = "Giá trị không được âm")
        private BigDecimal assetValue;

        private LocalDate purchaseDate;

        /** AVAILABLE | RETIRED */
        private AssetStatus initialStatus;

        /** NEW | GOOD | DAMAGED | LOST | DISPOSED */
        private AssetCondition condition;

        @Size(max = 255)
        private String location;

        private String notes;
        private String description;

        private LocalDate warrantyUntil;

        @Size(max = 255)
        private String supplierName;

        private LocalDate contractUntil;

        @Size(max = 100)
        private String contractNumber;

        @Size(max = 500)
        private String imageUrl;
    }

    /**
     * Payload từ form "Chỉnh sửa tài sản".
     * Field names khớp với AssetUpdatePayload của frontend (assetService.ts).
     * Tất cả optional — null = không đổi.
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        @Size(max = 255)
        private String name;

        @Size(max = 100)
        private String type;

        private String description;

        @DecimalMin("0.0")
        private BigDecimal value;

        private LocalDate purchaseDate;

        private String warrantyDate;      // ISO date string
        private String supplier;
        private String contractDate;      // ISO date string

        private AssetCondition condition;

        private String note;
        private String image;
        private String locationOrUser;
        private Long assignedEmployeeId;

        @Size(max = 100)
        private String contractNumber;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssignRequest {
        @NotNull(message = ValidationMessages.EMPLOYEE_ID_REQUIRED)
        private Long employeeId;
        private String notes;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReturnRequest {
        @NotNull
        private AssetCondition conditionOnReturn;
        @NotNull
        private Boolean readyToReuse;
        private String notes;
    }
}