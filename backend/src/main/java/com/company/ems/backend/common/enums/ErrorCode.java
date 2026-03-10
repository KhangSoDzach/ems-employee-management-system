package com.company.ems.backend.common.enums;

import com.company.ems.backend.common.message.MessageKey;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    AUTH_INVALID_CREDENTIAL (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_INVALID_CREDENTIAL),
    AUTH_TOKEN_EXPIRED      (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_TOKEN_EXPIRED),
    AUTH_TOKEN_INVALID      (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_TOKEN_INVALID),
    AUTH_TOKEN_MISSING      (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_TOKEN_MISSING),
    AUTH_UNAUTHORIZED       (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_UNAUTHORIZED),
    AUTH_ACCOUNT_LOCKED     (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_ACCOUNT_LOCKED),
    AUTH_ACCOUNT_DISABLED   (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_ACCOUNT_DISABLED),
    AUTH_ACCOUNT_SUSPENDED  (HttpStatus.UNAUTHORIZED,          MessageKey.AUTH_ACCOUNT_SUSPENDED),

    // ── Authorization ─────────────────────────────────────────────────────────
    ACCESS_DENIED           (HttpStatus.FORBIDDEN,             MessageKey.ACCESS_DENIED),
    ACCESS_ROLE_REQUIRED    (HttpStatus.FORBIDDEN,             MessageKey.ACCESS_ROLE_REQUIRED),

    // ── Resource ──────────────────────────────────────────────────────────────
    RESOURCE_NOT_FOUND      (HttpStatus.NOT_FOUND,             MessageKey.RESOURCE_NOT_FOUND),
    RESOURCE_CONFLICT       (HttpStatus.CONFLICT,              MessageKey.RESOURCE_CONFLICT),

    // ── Validation ────────────────────────────────────────────────────────────
    VALID_REQUEST_BODY      (HttpStatus.BAD_REQUEST,           MessageKey.VALID_REQUEST_BODY),
    VALID_PARAM_INVALID     (HttpStatus.BAD_REQUEST,           MessageKey.VALID_PARAM_INVALID),
    VALID_PARAM_MISSING     (HttpStatus.BAD_REQUEST,           MessageKey.VALID_PARAM_MISSING),
    VALID_METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED,    MessageKey.VALID_METHOD_NOT_ALLOWED),

    INTERNAL_ERROR          (HttpStatus.INTERNAL_SERVER_ERROR, MessageKey.INTERNAL_ERROR);
    private final HttpStatus httpStatus;
    private final MessageKey messageKey;
    public int getStatusCode() {
        return httpStatus.value();
    }
}
