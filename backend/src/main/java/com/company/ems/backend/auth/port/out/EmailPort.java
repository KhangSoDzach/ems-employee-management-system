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

    /**
     * Send a welcome email containing the new employee's login credentials.
     * Must be invoked asynchronously so it never blocks the employee-creation
     * transaction. If delivery fails, the caller is responsible for logging
     * the error without propagating the exception.
     *
     * @param toEmail     HR-registered email address of the new employee
     * @param fullName    employee's full name (used for personalisation)
     * @param username    login username — the auto-generated employee code
     * @param rawPassword auto-generated default password (employeeCode + DOB as ddMMyy)
     */
    void sendAccountCredentialsEmail(String toEmail, String fullName,
                                     String username, String rawPassword);

    /**
     * Send an internal announcement email to a recipient.
     *
     * @param toEmail        recipient email address
     * @param title          announcement title
     * @param content        announcement content
     * @param publishedAtIso publication timestamp in ISO-8601 format
     */
    void sendAnnouncementEmail(String toEmail, String title, String content, String publishedAtIso);
}
