package com.company.ems.backend.common.message;

import com.company.ems.backend.common.enums.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    public String get(MessageCode code, Object... args) {
        String key = Objects.requireNonNull(
            Objects.requireNonNull(code, "code must not be null").getKey(),
            "message key must not be null"
        );
        return messageSource.getMessage(
            key,
                args,
                LocaleContextHolder.getLocale());
    }

    public String get(ErrorCode errorCode, Object... args) {
        String key = Objects.requireNonNull(
            Objects.requireNonNull(errorCode, "errorCode must not be null").getMessageKey().getKey(),
            "error message key must not be null"
        );
        return messageSource.getMessage(
            key,
                args,
                LocaleContextHolder.getLocale()
        );
    }

    public String get(MessageCode code, Locale locale, Object... args) {
        String key = Objects.requireNonNull(
            Objects.requireNonNull(code, "code must not be null").getKey(),
            "message key must not be null"
        );
        return messageSource.getMessage(
            key,
                args,
                Objects.requireNonNull(locale, "locale must not be null")
        );
    }
}