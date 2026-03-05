package com.company.ems.backend.asset.enums;

import lombok.Getter;

@Getter
public enum AssetStatus {
    AVAILABLE("Sẵn sàng", "available"),
    ASSIGNED("Đang cấp phát", "assigned"),
    MAINTENANCE("Bảo trì", "maintenance"),
    RETIRED("Ngừng sử dụng", "retired");

    private final String displayName;
    private final String cssClass;

    AssetStatus(String displayName, String cssClass) {
        this.displayName = displayName;
        this.cssClass = cssClass;
    }
}