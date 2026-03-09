package com.company.ems.backend.asset.dto;

import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.common.validation.ValidationMessages;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class AssetDto {

    private AssetDto() {}

    @Data @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Summary {
        private String id;
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
        private String name;
        private String code;
        private String type;
        private String value;
        private String purchaseDate;
        private String status;
        private String condition;
        private String warranty;
        private String supplier;
        private String contract;
        private String location;
        private String description;
        private String imageUrl;
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


    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = ValidationMessages.ASSET_NAME_REQUIRED)
        @Size(max = 255)
        private String assetName;

        @Size(max = 50)
        private String assetType;

        @DecimalMin("0.0")
        private BigDecimal assetValue;

        private LocalDate purchaseDate;

        private AssetStatus initialStatus;

        private AssetCondition condition;
        @Size(max = 255)
        private String location;

        private String notes;
        private String description;

        private LocalDate warrantyUntil;

        @Size(max = 255)
        private String supplierName;

        private LocalDate contractUntil;

        @Size(max = 500)
        private String imageUrl;

        @Size(max = 100)
        private String contractNumber;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        @Size(max = 255)
        private String name;

        @Size(max = 50)
        private String type;

        private String description;

        @DecimalMin("0.0")
        private BigDecimal value;

        private LocalDate purchaseDate;

        private String warrantyDate;
        private String supplier;
        private String contractDate;

        private AssetCondition condition;

        private String note;
        private String image;
        private String locationOrUser;
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


    @Data @Builder
    public static class CodePreview {
        private String nextCode;
    }
}
