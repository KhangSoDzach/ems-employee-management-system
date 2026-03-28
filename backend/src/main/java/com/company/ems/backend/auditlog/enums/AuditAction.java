package com.company.ems.backend.auditlog.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Standardized audit actions with classification.
 * Optimized for Enterprise Auditing & Security tracking.
 */
@Getter
@RequiredArgsConstructor
public enum AuditAction {

    // AUTHENTICATION
    LOGIN_SUCCESS(EventType.AUTHENTICATION),
    LOGIN_FAILED(EventType.AUTHENTICATION),
    LOGOUT(EventType.AUTHENTICATION),
    TOKEN_REFRESH(EventType.AUTHENTICATION),
    TOKEN_REFRESH_FAILED(EventType.AUTHENTICATION),
    PASSWORD_CHANGE(EventType.AUTHENTICATION),
    TOKEN_REVOKE(EventType.AUTHENTICATION),
    TOKEN_EXPIRED(EventType.AUTHENTICATION),

    // AUTHORIZATION
    ACCESS_DENIED(EventType.AUTHORIZATION),

    // SECURITY
    RATE_LIMIT_EXCEEDED(EventType.SECURITY),
    SUSPICIOUS_ACTIVITY(EventType.SECURITY),

    // DATA_CHANGE
    CREATE(EventType.DATA_CHANGE),
    UPDATE(EventType.DATA_CHANGE),
    DELETE(EventType.DATA_CHANGE),
    UPDATE_EMPLOYEE(EventType.DATA_CHANGE),

    // ASSETS
    ASSET_SUBMIT(EventType.DATA_CHANGE),
    ASSET_APPROVE(EventType.DATA_CHANGE),
    ASSET_REJECT(EventType.DATA_CHANGE),

    // GENERIC ACTIONS
    SUBMIT(EventType.DATA_CHANGE),
    APPROVE(EventType.DATA_CHANGE),
    REJECT(EventType.DATA_CHANGE),
    CANCEL(EventType.DATA_CHANGE),

    // ATTENDANCE
    CHECK_IN(EventType.DATA_CHANGE),
    CHECK_OUT(EventType.DATA_CHANGE),

    // PAYROLL
    PAYROLL_RUN(EventType.DATA_CHANGE),
    PAYROLL_RECALCULATE(EventType.DATA_CHANGE);

    private final EventType type;
}
