package com.company.ems.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * AC-02: Thông báo thống nhất khi bị từ chối quyền.
 * HTTP Status: 403 Forbidden
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    private static final String DEFAULT_MESSAGE = "Bạn không có quyền truy cập chức năng này";

    public ForbiddenException() {
        super(DEFAULT_MESSAGE);
    }

    public ForbiddenException(String message) {
        super(message);
    }
}