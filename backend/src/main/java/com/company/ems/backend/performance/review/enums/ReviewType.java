package com.company.ems.backend.performance.review.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReviewType {
    SELF, PEER, MANAGER;

    @JsonValue
    public String toJson() { return name(); }

    @JsonCreator
    public static ReviewType fromJson(String value) {
        if (value == null) throw new IllegalArgumentException("reviewType cannot be null");
        return ReviewType.valueOf(value.toUpperCase());
    }
}