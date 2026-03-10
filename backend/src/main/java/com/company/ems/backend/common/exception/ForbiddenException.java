package com.company.ems.backend.common.exception;

import com.company.ems.backend.common.message.MessageCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@Getter
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {
    private final MessageCode messageCode;
    private final Object[]    messageArgs;

    public ForbiddenException() {
        super(MessageCode.ERROR_FORBIDDEN.getKey());
        this.messageCode = MessageCode.ERROR_FORBIDDEN;
        this.messageArgs = new Object[0];
    }

    public ForbiddenException(MessageCode code, Object... args) {
        super(code.getKey());
        this.messageCode = code;
        this.messageArgs = args;
    }

    public ForbiddenException(String resolvedMessage) {
        super(resolvedMessage);
        this.messageCode = null;
        this.messageArgs = new Object[0];
    }
}