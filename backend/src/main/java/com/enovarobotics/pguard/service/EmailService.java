package com.enovarobotics.pguard.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.mail.from-name:PGuard Monitor}")
    private String fromName;

    public boolean sendVerificationCode(String toEmail, String fullName, String code) {

        if (toEmail == null || toEmail.isBlank()) {
            log.error("Recipient email is empty.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("PGuard Monitor - Verification Code");
            helper.setText(buildVerificationEmailHtml(fullName, code), true);

            mailSender.send(message);

            log.info("Verification email sent successfully to {}", toEmail);

            return true;

        } catch (Exception e) {

            log.error("Failed to send email to {}", toEmail, e);

            return false;
        }
    }

    private String buildVerificationEmailHtml(String fullName, String code) {

        if (fullName == null) {
            fullName = "";
        }

        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family:Arial,sans-serif;padding:20px;">
                    <h2>PGuard Monitor</h2>

                    <p>Hello %s,</p>

                    <p>Your verification code is:</p>

                    <h1 style="color:#0f766e;">%s</h1>

                    <p>This code expires in 10 minutes.</p>

                    <p>If you didn't request this code, simply ignore this email.</p>
                </body>
                </html>
                """.formatted(fullName, code);
    }
}