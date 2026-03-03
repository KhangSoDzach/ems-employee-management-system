package com.company.ems.backend.audit.enums;

public enum AuditActionType {
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    TOKEN_REFRESH_SUCCESS,
    TOKEN_REFRESH_FAILED,
    LOGOUT,
    LOGOUT_ALL_DEVICES,
    TOKEN_REVOKED,
    ACCOUNT_LOCKED,
    ACCOUNT_UNLOCKED,
}