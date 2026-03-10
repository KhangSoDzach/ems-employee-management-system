package com.company.ems.backend.common.message;

import com.company.ems.backend.common.enums.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    public String get(MessageCode code, Object... args) {
        return messageSource.getMessage(
                code.getKey(),
                args,
                LocaleContextHolder.getLocale());
    }

    public String get(ErrorCode errorCode, Object... args) {
        return messageSource.getMessage(
                errorCode.getMessageKey().getKey(),
                args,
                LocaleContextHolder.getLocale()
        );
    }

    public String get(MessageCode code, Locale locale, Object... args) {
        return messageSource.getMessage(code.getKey(), args, locale);
    }
}