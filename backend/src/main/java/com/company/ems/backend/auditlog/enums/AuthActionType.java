package com.company.ems.backend.auditlog.enums;

/**
 * Authentication-related action types for the Audit Log.
 * Append new values as the system evolves – never rename/remove existing ones.
 */
public enum AuthActionType {

    /** User authenticated with valid credentials (SSO or JWT). */
    LOGIN_SUCCESS,

    /** Authentication attempt was rejected (bad credentials, locked account, disabled). */
    LOGIN_FAILED,

    /** A valid Refresh Token was exchanged for a new Access Token. */
    TOKEN_REFRESH_SUCCESS,

    /** Refresh Token was invalid, expired, or revoked – refresh was denied. */
    TOKEN_REFRESH_FAILED,

    /** User explicitly logged out (single device – refresh token revoked). */
    LOGOUT,

    /** One or all refresh tokens for a user were revoked (admin action or logout-all). */
    TOKEN_REVOKED
}
