package com.skipq.backend.service;

import com.skipq.backend.entity.OtpPurpose;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends OTP emails via Spring Mail (Gmail SMTP in this deployment).
 *
 * Deliberately channel-agnostic in shape — {@link com.skipq.backend.service.OtpService}
 * calls a single {@code sendOtp(...)} method and doesn't know or care that
 * it's email under the hood. If SMS is ever added, it becomes a sibling
 * implementation behind the same seam rather than a rewrite of OtpService.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String fromAddress) {

        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    /**
     * Sends a 6-digit OTP code to the given address, with subject/body
     * copy tailored to why the OTP was requested.
     *
     * @throws MailException if the message cannot be sent (SMTP failure,
     *         bad credentials, etc.) — callers should treat this as a
     *         hard failure of the "generate OTP" step, not a silent no-op.
     */
    public void sendOtp(String toEmail, String otpCode, OtpPurpose purpose, int expiryMinutes) {
        String subject = subjectFor(purpose);
        String html = htmlBodyFor(purpose, otpCode, expiryMinutes);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail.trim().toLowerCase());
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Failed to build OTP email.", ex);
        }
    }

    private String subjectFor(OtpPurpose purpose) {
        return switch (purpose) {
            case REGISTER -> "Verify your SkipQ account";
            case RESET_PASSWORD -> "Reset your SkipQ password";
        };
    }

    private String htmlBodyFor(OtpPurpose purpose, String otpCode, int expiryMinutes) {
        String heading = purpose == OtpPurpose.REGISTER
                ? "Confirm your email to finish creating your account"
                : "Confirm your identity to reset your password";

        return """
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2D2D2D;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 20px; font-weight: 700; color: #1B4332;">SkipQ</span>
                  </div>
                  <h2 style="font-size: 18px; color: #1B4332; margin-bottom: 8px;">%s</h2>
                  <p style="font-size: 14px; color: #6C757D; margin-bottom: 24px;">
                    Enter this code in the app to continue. It expires in %d minutes.
                  </p>
                  <div style="background: #D8F3DC; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1B4332;">%s</span>
                  </div>
                  <p style="font-size: 13px; color: #6C757D;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
                """.formatted(heading, expiryMinutes, otpCode);
    }
}