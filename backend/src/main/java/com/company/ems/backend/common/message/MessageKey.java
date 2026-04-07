package com.company.ems.backend.common.message;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MessageKey {
    AUTH_INVALID_CREDENTIAL   ("auth.invalid.credentials"),
    AUTH_TOKEN_EXPIRED        ("auth.token.expired"),
    AUTH_TOKEN_INVALID        ("auth.token.invalid"),
    AUTH_TOKEN_MISSING        ("auth.token.missing"),
    AUTH_UNAUTHORIZED         ("auth.unauthorized"),
    AUTH_ACCOUNT_LOCKED       ("auth.account.locked"),
    AUTH_ACCOUNT_DISABLED     ("auth.account.disabled"),
    AUTH_LOGIN_SUCCESS        ("auth.login.success"),
    AUTH_LOGOUT_SUCCESS       ("auth.logout.success"),
    AUTH_REFRESH_SUCCESS      ("auth.refresh.success"),

    // ── Authorization ─────────────────────────────────────────────────────────
    ACCESS_DENIED             ("access.denied"),
    ACCESS_ROLE_REQUIRED      ("access.role.required"),

    // ── Resource ──────────────────────────────────────────────────────────────
    RESOURCE_NOT_FOUND        ("resource.not_found"),
    RESOURCE_CONFLICT         ("resource.conflict"),
    RESOURCE_CREATED          ("resource.created"),
    RESOURCE_UPDATED          ("resource.updated"),
    RESOURCE_DELETED          ("resource.deleted"),

    // ── Validation ────────────────────────────────────────────────────────────
    VALID_REQUEST_BODY        ("valid.request_body"),
    VALID_PARAM_INVALID       ("valid.param.invalid"),
    VALID_PARAM_MISSING       ("valid.param.missing"),
    VALID_METHOD_NOT_ALLOWED  ("valid.method_not_allowed"),

    // ── Password ──────────────────────────────────────────────────────────────
    PASSWORD_CHANGED          ("password.changed"),
    PASSWORD_INCORRECT        ("password.incorrect"),
    PASSWORD_EMPTY            ("password.empty"),
    PASSWORD_TOO_SHORT        ("password.too_short"),
    PASSWORD_NO_UPPERCASE     ("password.no_uppercase"),
    PASSWORD_NO_LOWERCASE     ("password.no_lowercase"),
    PASSWORD_NO_DIGIT         ("password.no_digit"),
    PASSWORD_NO_SPECIAL       ("password.no_special"),
    PASSWORD_SAME_AS_OLD      ("password.same_as_old"),
    PASSWORD_MISMATCH         ("password.mismatch"),

    AUTH_ACCOUNT_SUSPENDED    ("auth.account.suspended"),

    // ── 2FA ───────────────────────────────────────────────────────────────────
    TWO_FA_SETUP_SUCCESS      ("2fa.setup.success"),
    TWO_FA_ENABLED            ("2fa.enabled"),
    TWO_FA_DISABLED           ("2fa.disabled"),
    TWO_FA_ALREADY_ENABLED    ("2fa.already_enabled"),
    TWO_FA_NOT_ENABLED        ("2fa.not_enabled"),
    TWO_FA_NOT_INITIATED      ("2fa.not_initiated"),
    TWO_FA_INVALID_CODE       ("2fa.invalid_code"),
    TWO_FA_INVALID_PASSWORD   ("2fa.invalid_password_or_code"),
    TWO_FA_RECOVERY_FAILED    ("2fa.recovery_code_failed"),
    TWO_FA_SETUP_MSG          ("2fa.setup_message"),
    TWO_FA_ENABLED_MSG        ("2fa.enabled_message"),
    TWO_FA_DISABLED_MSG       ("2fa.disabled_message"),
    INTERNAL_ERROR            ("internal.error");

    private final String key;
}
