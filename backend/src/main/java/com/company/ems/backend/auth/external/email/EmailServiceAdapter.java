package com.company.ems.backend.auth.external.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.company.ems.backend.auth.port.out.EmailPort;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Infrastructure adapter that implements {@link EmailPort} using Spring's
 * JavaMailSender.
 * Lives in the Infrastructure layer; the Application layer depends only on the
 * EmailPort interface.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailServiceAdapter implements EmailPort {

  private final JavaMailSender mailSender;

  /** Sender address, externalized via app.mail.from in application.yaml */
  @Value("${app.mail.from}")
  private String fromAddress;

  /**
   * {@inheritDoc}
   *
   * Sends an HTML email containing the 6-digit OTP.
   */
  @Override
  public void sendPasswordResetOtp(String toEmail, String otp) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromAddress);
      helper.setTo(toEmail);
      helper.setSubject("[EMS] Mã xác thực đặt lại mật khẩu");
      helper.setText(buildEmailBody(otp), /* isHtml */ true);

      mailSender.send(message);
      log.info("Password reset OTP email sent to: {}", toEmail);

    } catch (MessagingException | org.springframework.mail.MailException e) {
      log.error("!!! EMAIL SEND FAILED to [{}] via [{}] rootCause=[{}]",
          toEmail, fromAddress, e.getClass().getName(), e);
      throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────

  private String buildEmailBody(String otp) {
    return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8"/>
          <title>Đặt lại mật khẩu</title>
        </head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
          <div style="max-width:480px;margin:auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color:#E53E3E;text-align:center;">🔐 Đặt lại mật khẩu EMS</h2>
            <p style="color:#444;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p style="color:#444;">Mã xác thực (OTP) của bạn là:</p>
            <div style="text-align:center;margin:24px 0;">
              <span style="display:inline-block;font-size:36px;font-weight:bold;letter-spacing:0.5em;color:#2D3748;background:#EDF2F7;padding:16px 32px;border-radius:8px;border:2px dashed #E53E3E;">
                %s
              </span>
            </div>
            <p style="color:#666;font-size:14px;">⏱️ Mã có hiệu lực trong <strong>5 phút</strong>.</p>
            <p style="color:#666;font-size:14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
            <p style="color:#999;font-size:12px;text-align:center;">
              Employee Management System &mdash; No-reply
            </p>
          </div>
        </body>
        </html>
        """
        .formatted(otp);
  }
}
