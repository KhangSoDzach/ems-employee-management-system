package com.company.ems.backend.security.util;

import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.company.ems.backend.common.exception.InvalidPasswordException;

@Component
@RequiredArgsConstructor
public class PasswordValidator {

    private final MessageService messages;

    private static final int MIN_LENGTH = 8;
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*[0-9].*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*";

    public void validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new InvalidPasswordException(messages.get(MessageCode.PASSWORD_EMPTY));
        }

        if (password.length() < MIN_LENGTH) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_TOO_SHORT, MIN_LENGTH)
            );
        }

        if (!password.matches(UPPERCASE_PATTERN)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_NO_UPPERCASE)
            );
        }

        if (!password.matches(LOWERCASE_PATTERN)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_NO_LOWERCASE)
            );
        }

        if (!password.matches(DIGIT_PATTERN)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_NO_DIGIT)
            );
        }

        if (!password.matches(SPECIAL_CHAR_PATTERN)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_NO_SPECIAL)
            );
        }
    }

    public void validatePasswordDifferent(String oldPassword, String newPassword) {
        if (oldPassword.equals(newPassword)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_SAME_AS_OLD)
            );
        }
    }

    public void validatePasswordMatch(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new InvalidPasswordException(
                    messages.get(MessageCode.PASSWORD_MISMATCH)
            );
        }
    }
}