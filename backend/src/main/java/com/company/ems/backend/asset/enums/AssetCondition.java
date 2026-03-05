package com.company.ems.backend.asset.enums;

import lombok.Getter;

@Getter
public enum AssetCondition {
    NEW("Mới", "new"),
    GOOD("Tốt", "good"),
    FAIR("Khá", "fair"),
    DAMAGED("Hỏng", "damaged"),
    LOST("Mất", "lost"),
    DISPOSED("Thanh lý", "disposed");

    private final String displayName;
    private final String cssClass;

    AssetCondition(String displayName, String cssClass) {
        this.displayName = displayName;
        this.cssClass = cssClass;
    }
}