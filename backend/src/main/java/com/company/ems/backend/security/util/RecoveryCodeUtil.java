package com.company.ems.backend.security.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class RecoveryCodeUtil {

    private static final int RECOVERY_CODE_COUNT = 10;
    private static final int RECOVERY_CODE_LENGTH = 10;
    private static final String RECOVERY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars

    private final SecureRandom secureRandom;
    private final BCryptPasswordEncoder encoder;

    public RecoveryCodeUtil() {
        this.secureRandom = new SecureRandom();
        this.encoder = new BCryptPasswordEncoder();
    }

    public List<String> generateRecoveryCodes() {
        List<String> codes = new ArrayList<>();

        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            codes.add(generateSingleCode());
        }

        return codes;
    }

    private String generateSingleCode() {
        StringBuilder code = new StringBuilder(RECOVERY_CODE_LENGTH);

        for (int i = 0; i < RECOVERY_CODE_LENGTH; i++) {
            int index = secureRandom.nextInt(RECOVERY_CODE_CHARS.length());
            code.append(RECOVERY_CODE_CHARS.charAt(index));

            // Add hyphen every 5 characters for readability
            if (i == 4) {
                code.append("-");
            }
        }

        return code.toString();
    }

    public List<String> hashRecoveryCodes(List<String> codes) {
        List<String> hashedCodes = new ArrayList<>();

        for (String code : codes) {
            hashedCodes.add(encoder.encode(code));
        }

        return hashedCodes;
    }

    public int verifyRecoveryCode(String code, List<String> hashedCodes) {
        if (code == null || hashedCodes == null || hashedCodes.isEmpty()) {
            return -1;
        }

        // Normalize code (remove spaces and hyphens, uppercase)
        String normalizedCode = code.replace(" ", "")
                .replace("-", "")
                .toUpperCase();

        for (int i = 0; i < hashedCodes.size(); i++) {
            try {
                if (encoder.matches(normalizedCode, hashedCodes.get(i))) {
                    return i;
                }
            } catch (Exception e) {
                log.error("Error verifying recovery code", e);
            }
        }

        return -1;
    }
}

