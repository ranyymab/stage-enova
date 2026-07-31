package com.enovarobotics.pguard.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envoi des e-mails transactionnels (code de vérification d'inscription).
 * Utilise spring-boot-starter-mail (JavaMailSender) configuré avec un vrai
 * serveur SMTP dans application.properties (voir spring.mail.*). En
 * développement sans SMTP configuré, l'envoi échoue proprement, le code
 * est journalisé (log) pour ne pas bloquer les tests locaux, et la méthode
 * retourne {@code false} pour que l'appelant sache que l'e-mail n'est PAS
 * réellement parti (voir VerificationCodeService/AuthController, qui
 * renvoient alors le code directement dans la réponse API en mode dev
 * plutôt que de laisser croire à un envoi réussi) — mais en production,
 * `app.mail.log-code-fallback` doit rester à false.
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

    /** Indique si un code non livré par e-mail doit être renvoyé au client
     *  (mode démo/dev) plutôt que de rester uniquement dans les logs serveur. */
    public boolean isLogCodeFallbackEnabled() {
        return logCodeFallback;
    }

    public boolean sendVerificationCode(String toEmail, String fullName, String code) {
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
            return true;
        } catch (Exception e) {
            // Catch volontairement large (et non plus limité à MailException /
            // MessagingException / UnsupportedEncodingException) : n'importe
            // quelle erreur d'envoi (SMTP non configuré, identifiants invalides,
            // hôte injoignable, timeout réseau...) doit retomber ici plutôt que
            // de remonter et faire échouer l'inscription (@Transactional
            // annulerait alors la création du compte ET du code, laissant
            // l'utilisateur totalement bloqué sans jamais recevoir de code).
            log.error("Échec d'envoi de l'e-mail de vérification à {} : {}", maskEmail(toEmail), e.getMessage());
            // L'inscription ne doit JAMAIS échouer à cause d'un problème SMTP.
            // Si app.mail.log-code-fallback est actif (par défaut), le code est
            // renvoyé à l'appelant (VerificationCodeService -> AuthController)
            // pour être affiché directement dans l'interface (voir le bandeau
            // "Serveur d'e-mail non configuré" côté frontend) plutôt que de
            // rester invisible dans les logs serveur. Sinon, il est seulement
            // journalisé côté serveur, mais l'inscription reste acceptée dans
            // les deux cas : l'utilisateur ne se retrouve jamais bloqué sans
            // aucun moyen de récupérer son code.
            if (logCodeFallback) {
                log.warn("[DEV ONLY] Code de vérification pour {} : {}", maskEmail(toEmail), code);
            } else {
                log.warn("Code de vérification pour {} (non exposé au client, app.mail.log-code-fallback=false) : {}",
                        maskEmail(toEmail), code);
            }
            return false;
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
