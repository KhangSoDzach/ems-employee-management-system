package com.company.ems.backend.performance.review.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReviewStatus {
    SUBMITTED, ACKNOWLEDGED, ARCHIVED;

    @JsonValue
    public String toJson() { return name(); }

    @JsonCreator
    public static ReviewStatus fromJson(String value) {
        if (value == null) return SUBMITTED;
        return ReviewStatus.valueOf(value.toUpperCase());
    }
}