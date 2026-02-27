package com.company.ems.backend.auth.port.out;

/**
 * Output port (Hexagonal Architecture) for sending emails.
 * Implementations live in the Infrastructure layer (EmailServiceAdapter).
 * The Application layer depends only on this interface, never on
 * JavaMailSender.
 */
public interface EmailPort {

    /**
     * Send a password reset OTP email to the given address.
     *
     * @param toEmail recipient email address
     * @param otp     the 6-digit plain-text OTP to include in the email
     */
    void sendPasswordResetOtp(String toEmail, String otp);
}
