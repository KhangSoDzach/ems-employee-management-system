package com.company.ems.backend.auth.external.email;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.company.ems.backend.auth.port.out.EmailPort;

import lombok.extern.slf4j.Slf4j;

/**
 * Mock implementation of {@link EmailPort} for development environments.
 * Logs the OTP to console instead of sending actual emails.
 * Active for all non-test profiles when mail is not enabled.
 */
@Component
@Profile("!test")
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class MockEmailServiceAdapter implements EmailPort {

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        log.warn("[MOCK EMAIL] Password Reset OTP for [{}]: {}", toEmail, otp);
    }

    @Override
    public void sendAccountCredentialsEmail(String toEmail, String fullName,
                                            String username, String rawPassword) {
        log.warn("[MOCK EMAIL] Account Credentials for [{}] - User: {}, Password: {}",
                toEmail, username, rawPassword);
    }

    @Override
    public void sendAnnouncementEmail(String toEmail, String title, String content, String publishedAtIso) {
        log.warn("[MOCK EMAIL] Announcement '{}' sent to [{}] at {}", title, toEmail, publishedAtIso);
    }
}
