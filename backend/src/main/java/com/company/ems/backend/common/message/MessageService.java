package com.company.ems.backend.common.message;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

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
}