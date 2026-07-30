package com.enovarobotics.pguard.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envoi des e-mails transactionnels (code de vérification d'inscription).
 * Utilise spring-boot-starter-mail (JavaMailSender) configuré avec un vrai
 * serveur SMTP dans application.properties (voir spring.mail.*). En
 * développement sans SMTP configuré, l'envoi échoue proprement et le code
 * est tout de même journalisé (log) pour ne pas bloquer les tests locaux —
 * mais en production, `app.mail.log-code-fallback` doit rester à false.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.mail.from-name:PGuard Monitor}")
    private String fromName;

    @Value("${app.mail.log-code-fallback:false}")
    private boolean logCodeFallback;

    public void sendVerificationCode(String toEmail, String fullName, String code) {
        String subject = "Votre code de vérification PGuard Monitor";
        String html = buildVerificationEmailHtml(fullName, code);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress, fromName);
            }
            mailSender.send(message);
            log.info("Code de vérification envoyé à {}", maskEmail(toEmail));
        } catch (MailException | jakarta.mail.MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Échec d'envoi de l'e-mail de vérification à {} : {}", maskEmail(toEmail), e.getMessage());
            if (logCodeFallback) {
                // Utilisé UNIQUEMENT en développement local quand aucun SMTP n'est
                // configuré, pour ne pas bloquer les tests manuels. Ne jamais
                // activer app.mail.log-code-fallback en production.
                log.warn("[DEV ONLY] Code de vérification pour {} : {}", maskEmail(toEmail), code);
            } else {
                throw new EmailDeliveryException("Impossible d'envoyer l'e-mail de vérification", e);
            }
        }
    }

    private String buildVerificationEmailHtml(String fullName, String code) {
        String safeName = fullName == null || fullName.isBlank() ? "" : escapeHtml(fullName);
        return """
                <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
                  <h2 style="color:#0f766e;margin-bottom:4px;">PGuard Monitor</h2>
                  <p style="color:#334155;">Bonjour %s,</p>
                  <p style="color:#334155;">Voici votre code de vérification pour confirmer votre adresse e-mail :</p>
                  <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f0fdfa;color:#0f766e;padding:16px;border-radius:8px;margin:20px 0;">%s</div>
                  <p style="color:#64748b;font-size:13px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
                </div>
                """.formatted(safeName.isBlank() ? "" : safeName, code);
    }

    private String escapeHtml(String input) {
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***";
        return email.charAt(0) + "***" + email.substring(at);
    }

    public static class EmailDeliveryException extends RuntimeException {
        public EmailDeliveryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
