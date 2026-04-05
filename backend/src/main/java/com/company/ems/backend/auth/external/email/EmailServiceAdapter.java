package com.company.ems.backend.auth.external.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
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
 * Active only when 'dev' profile is NOT active AND 'test' profile is NOT active
 * AND app.mail.enabled is true.
 */
@Component
@Profile("!dev & !test")
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
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
            helper.setText(buildOtpEmailBody(otp), /* isHtml */ true);

            mailSender.send(message);
            log.info("Password reset OTP email sent to: {}", toEmail);

        } catch (MessagingException | org.springframework.mail.MailException e) {
            log.error("!!! EMAIL SEND FAILED to [{}] via [{}] rootCause=[{}]",
                    toEmail, fromAddress, e.getClass().getName(), e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    /**
     * {@inheritDoc}
     *
     * Sends a professional HTML welcome email with the new employee's login
     * credentials. This method re-throws on failure so that the async wrapper
     * ({@code EmployeeEmailNotificationService}) can log the error without
     * propagating it to the employee-creation transaction.
     */
    @Override
    public void sendAccountCredentialsEmail(String toEmail, String fullName,
                                            String username, String rawPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("[EMS] Thông tin tài khoản của bạn");
            helper.setText(buildCredentialsEmailBody(fullName, username, rawPassword), true);

            mailSender.send(message);
            log.info("[EMS-EMAIL] Account credentials email sent to: {}", toEmail);

        } catch (MessagingException | org.springframework.mail.MailException e) {
            log.error("[EMS-EMAIL] Failed to send credentials email to [{}]: {}",
                    toEmail, e.getMessage(), e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

      @Override
      public void sendAnnouncementEmail(String toEmail, String title, String content, String publishedAtIso) {
        try {
          MimeMessage message = mailSender.createMimeMessage();
          MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

          helper.setFrom(fromAddress);
          helper.setTo(toEmail);
          helper.setSubject("[EMS] Thông báo nội bộ mới: " + title);
          helper.setText(buildAnnouncementEmailBody(title, content, publishedAtIso), true);

          mailSender.send(message);
          log.info("[EMS-EMAIL] Announcement email sent to: {}", toEmail);
        } catch (MessagingException | org.springframework.mail.MailException e) {
          log.error("[EMS-EMAIL] Failed to send announcement email to [{}]: {}",
              toEmail, e.getMessage(), e);
          throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
      }

    // ──────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────

    private String buildOtpEmailBody(String otp) {
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

    private String buildCredentialsEmailBody(String fullName, String username, String rawPassword) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <title>Thông tin tài khoản EMS</title>
                </head>
                <body style="font-family:Arial,sans-serif;background:#f0f4f8;padding:24px;margin:0;">
                  <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">

                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#1a56db 0%%,#0e3f9e 100%%);padding:36px 32px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                        🎉 Chào mừng đến với EMS!
                      </h1>
                      <p style="color:#bdd7ff;margin:8px 0 0;font-size:14px;">Employee Management System</p>
                    </div>

                    <!-- Body -->
                    <div style="padding:32px;">
                      <p style="color:#2d3748;font-size:16px;margin:0 0 16px;">
                        Xin chào <strong>%s</strong>,
                      </p>
                      <p style="color:#4a5568;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        Tài khoản hệ thống EMS của bạn đã được tạo thành công bởi bộ phận HR.
                        Dưới đây là thông tin đăng nhập ban đầu của bạn:
                      </p>

                      <!-- Credentials Box -->
                      <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                        <table style="width:100%%;border-collapse:collapse;">
                          <tr>
                            <td style="color:#718096;font-size:13px;padding:8px 0;width:120px;vertical-align:top;">
                              👤 Tài khoản
                            </td>
                            <td style="color:#1a202c;font-size:15px;font-weight:600;font-family:monospace;padding:8px 0;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="color:#718096;font-size:13px;padding:8px 0;vertical-align:top;">
                              🔑 Mật khẩu
                            </td>
                            <td style="color:#1a202c;font-size:15px;font-weight:600;font-family:monospace;padding:8px 0;">
                              %s
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Security warning -->
                      <div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                        <p style="color:#744210;font-size:13px;margin:0;line-height:1.5;">
                          ⚠️ <strong>Lưu ý bảo mật:</strong> Đây là mật khẩu mặc định. Bạn nên đổi mật khẩu ngay sau lần đăng nhập đầu tiên để bảo vệ tài khoản của mình.
                        </p>
                      </div>

                      <p style="color:#4a5568;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        Nếu bạn gặp bất kỳ vấn đề gì khi đăng nhập, vui lòng liên hệ với bộ phận HR hoặc IT Support.
                      </p>
                    </div>

                    <!-- Footer -->
                    <div style="background:#f7fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                      <p style="color:#a0aec0;font-size:12px;margin:0;">
                        Employee Management System &mdash; Email tự động, vui lòng không trả lời.
                      </p>
                    </div>

                  </div>
                </body>
                </html>
                """
                .formatted(fullName, username, rawPassword);
    }

    private String buildAnnouncementEmailBody(String title, String content, String publishedAtIso) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8"/>
                  <title>Thông báo nội bộ</title>
                </head>
                <body style="font-family:Arial,sans-serif;background:#f0f4f8;padding:24px;margin:0;">
                  <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
                    <div style="background:linear-gradient(135deg,#1a56db 0%%,#0e3f9e 100%%);padding:24px 28px;">
                      <h2 style="margin:0;color:#ffffff;font-size:20px;">📢 Thông báo nội bộ EMS</h2>
                    </div>

                    <div style="padding:24px 28px;">
                      <p style="margin:0 0 12px;color:#4a5568;font-size:13px;">
                        Thời gian đăng: <strong>%s</strong>
                      </p>
                      <h3 style="margin:0 0 12px;color:#1a202c;font-size:18px;">%s</h3>
                      <div style="color:#2d3748;font-size:14px;line-height:1.7;white-space:pre-line;">%s</div>
                    </div>

                    <div style="background:#f7fafc;border-top:1px solid #e2e8f0;padding:16px 28px;text-align:center;">
                      <p style="color:#a0aec0;font-size:12px;margin:0;">
                        Employee Management System &mdash; Email tự động, vui lòng không trả lời.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """
                .formatted(publishedAtIso, title, content);
    }
}
