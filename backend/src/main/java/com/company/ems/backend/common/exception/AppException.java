package com.company.ems.backend.common.exception;

import com.company.ems.backend.common.enums.ErrorCode;
import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Object[] args;
    public AppException(ErrorCode errorCode, Object... args) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.args = args;
    }
}
