package com.company.ems.backend.security.util;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.CodeGenerationException;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Slf4j
@Component
public class TOTPUtil {

    private static final String ISSUER = "EMS - Employee Management System";
    private static final int CODE_DIGITS = 6;
    private static final int TIME_PERIOD = 30; // seconds

    private final SecretGenerator secretGenerator;
    private final TimeProvider timeProvider;
    private final CodeGenerator codeGenerator;
    private final CodeVerifier codeVerifier;
    private final QrGenerator qrGenerator;

    public TOTPUtil() {
        this.secretGenerator = new DefaultSecretGenerator();
        this.timeProvider = new SystemTimeProvider();
        this.codeGenerator = new DefaultCodeGenerator();
        this.qrGenerator = new ZxingPngQrGenerator();

        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(TIME_PERIOD);
        verifier.setAllowedTimePeriodDiscrepancy(1); // Allow 1 time step before/after
        this.codeVerifier = verifier;
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }
    public String generateQRCode(String secret, String email) {
        try {
            QrData data = new QrData.Builder()
                    .label(email)
                    .secret(secret)
                    .issuer(ISSUER)
                    .algorithm(HashingAlgorithm.SHA1)
                    .digits(CODE_DIGITS)
                    .period(TIME_PERIOD)
                    .build();

            byte[] imageData = qrGenerator.generate(data);
            String mimeType = qrGenerator.getImageMimeType();

            return getDataUriForImage(imageData, mimeType);
        } catch (QrGenerationException e) {
            log.error("Failed to generate QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    public boolean verifyCode(String secret, String code) {
        try {
            return codeVerifier.isValidCode(secret, code);
        } catch (Exception e) {
            log.error("Failed to verify TOTP code", e);
            return false;
        }
    }

    public String generateCurrentCode(String secret) throws CodeGenerationException {
        long currentBucket = Math.floorDiv(timeProvider.getTime(), TIME_PERIOD);
        return codeGenerator.generate(secret, currentBucket);
    }
}
