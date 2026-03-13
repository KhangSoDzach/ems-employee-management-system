package com.company.ems.backend.auditlog.enums;

/**
 * Authentication-related action types for the Audit Log.
 * Append new values as the system evolves – never rename/remove existing ones.
 */
public enum AuthActionType {

    /** User authenticated with valid credentials (SSO or JWT). */
    LOGIN_SUCCESS,

    /** User successfully changed their own password. */
    PASSWORD_CHANGED,

    /**
     * Authentication attempt was rejected (bad credentials, locked account,
     * disabled).
     */
    LOGIN_FAILED,

    /** A valid Refresh Token was exchanged for a new Access Token. */
    TOKEN_REFRESH_SUCCESS,

    /** Refresh Token was invalid, expired, or revoked – refresh was denied. */
    TOKEN_REFRESH_FAILED,

    /** User explicitly logged out (single device – refresh token revoked). */
    LOGOUT,

    /**
     * One or all refresh tokens for a user were revoked (admin action or
     * logout-all).
     */
    TOKEN_REVOKED,

    /** JWT access token was presented but was expired. */
    TOKEN_EXPIRED,

    /** JWT access token was invalid (bad signature/malformed). */
    TOKEN_INVALID,

    /** User attempted an operation they are not authorised to perform. */
    ACCESS_DENIED,

    /** Asset Incident Report was submitted by an employee. */
    ASSET_REPORT_SUBMITTED,

    /** Asset Incident Report was approved by HR/Admin. */
    ASSET_REPORT_APPROVED,

    /** Asset Incident Report was rejected by HR/Admin. */
    ASSET_REPORT_REJECTED
}
