package com.company.ems.backend.security.util;

import com.company.ems.backend.common.exception.InvalidPasswordException;

public class PasswordValidator {

    // Password must be at least 8 characters
    private static final int MIN_LENGTH = 8;

    // Regex patterns for password validation
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*[0-9].*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*";

    public static void validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new InvalidPasswordException("Password cannot be empty");
        }

        if (password.length() < MIN_LENGTH) {
            throw new InvalidPasswordException(
                    "Password must be at least " + MIN_LENGTH + " characters long"
            );
        }

        if (!password.matches(UPPERCASE_PATTERN)) {
            throw new InvalidPasswordException(
                    "Password must contain at least one uppercase letter"
            );
        }

        if (!password.matches(LOWERCASE_PATTERN)) {
            throw new InvalidPasswordException(
                    "Password must contain at least one lowercase letter"
            );
        }

        if (!password.matches(DIGIT_PATTERN)) {
            throw new InvalidPasswordException(
                    "Password must contain at least one digit"
            );
        }

        if (!password.matches(SPECIAL_CHAR_PATTERN)) {
            throw new InvalidPasswordException(
                    "Password must contain at least one special character"
            );
        }
    }

    public static void validatePasswordDifferent(String oldPassword, String newPassword) {
        if (oldPassword.equals(newPassword)) {
            throw new InvalidPasswordException(
                    "New password must be different from current password"
            );
        }
    }

    public static void validatePasswordMatch(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new InvalidPasswordException(
                    "Password and confirm password do not match"
            );
        }
    }
}
