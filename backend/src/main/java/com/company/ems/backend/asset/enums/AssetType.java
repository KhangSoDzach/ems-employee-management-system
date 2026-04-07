package com.company.ems.backend.asset.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum AssetType {
    LAPTOP("Laptop", "laptop"),
    PHONE("Điện thoại", "phone"),
    MONITOR("Màn hình", "monitor"),
    PARKING_CARD("Thẻ xe", "parking_card"),
    DESK("Bàn làm việc", "desk"),
    CHAIR("Ghế làm việc", "chair"),
    KEYBOARD("Bàn phím", "keyboard"),
    MOUSE("Chuột", "mouse"),
    HEADSET("Tai nghe", "headset"),
    OTHER("Khác", "other");

    private final String displayName;
    private final String code;

    AssetType(String displayName, String code) {
        this.displayName = displayName;
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static AssetType fromString(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toUpperCase();

        try {
            return AssetType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            for (AssetType type : values()) {
                if (type.code.equalsIgnoreCase(value)
                        || type.displayName.equalsIgnoreCase(value)
                        || type.name().equalsIgnoreCase(value)) {
                    return type;
                }
            }
        }

        throw new IllegalArgumentException("Invalid asset type: " + value +
                ". Valid values: LAPTOP, PHONE, MONITOR, PARKING_CARD, DESK, CHAIR, KEYBOARD, MOUSE, HEADSET, OTHER");
    }
}