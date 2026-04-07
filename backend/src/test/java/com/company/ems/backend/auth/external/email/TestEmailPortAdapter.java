package com.company.ems.backend.auth.external.email;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.company.ems.backend.auth.port.out.EmailPort;

/**
 * Test implementation of {@link EmailPort} for integration tests.
 * Does nothing - prevents Spring context failures in test profile.
 */
@Component
@Profile("test")
public class TestEmailPortAdapter implements EmailPort {

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        // No-op in tests
    }

    @Override
    public void sendAccountCredentialsEmail(String toEmail, String fullName,
                                            String username, String rawPassword) {
        // No-op in tests
    }

    @Override
    public void sendAnnouncementEmail(String toEmail, String title, String content, String publishedAtIso) {
        // No-op in tests
    }
}
