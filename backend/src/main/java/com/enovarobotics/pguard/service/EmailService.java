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

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.mail.from-name:PGuard Monitor}")
    private String fromName;

    @Value("${app.mail.log-code-fallback:false}")
    private boolean logCodeFallback;

    public boolean isEmailConfigured() {
        return fromAddress != null && !fromAddress.isBlank();
    }

    public boolean isLogCodeFallbackEnabled() {
        return logCodeFallback;
    }

    public boolean sendVerificationCode(String toEmail, String fullName, String code) {

        if (toEmail == null || toEmail.isBlank()) {
            log.error("Recipient email is empty.");
            return false;
        }

        if (!isEmailConfigured()) {
            log.warn("SMTP not configured. Email NOT sent to {}. "
                    + "Configure SMTP_USERNAME and SMTP_PASSWORD environment variables for Gmail.",
                    toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("PGuard Monitor - Votre Code de Vérification");
            helper.setText(buildVerificationEmailHtml(fullName, code), true);

            mailSender.send(message);

            log.info("Verification email sent successfully to {}", toEmail);
            return true;

        } catch (Exception e) {
            log.error("Failed to send email to {}. Error: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildVerificationEmailHtml(String fullName, String code) {
        if (fullName == null || fullName.isBlank()) {
            fullName = "Utilisateur";
        }

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .email-wrapper { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden; }
                        .header { background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%); color: white; padding: 40px 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
                        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
                        .content { padding: 40px 30px; }
                        .greeting { font-size: 16px; color: #1a1a1a; margin: 0 0 20px 0; }
                        .code-section { background: #f0fffe; border-left: 4px solid #1FC9BA; padding: 20px; margin: 30px 0; border-radius: 8px; }
                        .code-section p { margin: 0 0 12px 0; color: #666; font-size: 13px; }
                        .verification-code { font-size: 36px; font-weight: 700; color: #00AEA0; letter-spacing: 8px; text-align: center; margin: 20px 0; font-family: 'Courier New', monospace; }
                        .expiry-notice { font-size: 12px; color: #999; margin: 16px 0 0 0; }
                        .footer-text { font-size: 13px; color: #666; margin: 30px 0 0 0; line-height: 1.6; }
                        .security-note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 6px; font-size: 12px; color: #856404; }
                        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
                        .footer a { color: #1FC9BA; text-decoration: none; }
                        .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="email-wrapper">
                            <div class="header">
                                <h1>PGuard Monitor</h1>
                                <p>Système de Surveillance Robotique Autonome</p>
                            </div>

                            <div class="content">
                                <p class="greeting">Bonjour %s,</p>

                                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                    Vous avez demandé la création d'un compte PGuard Monitor. Veuillez utiliser le code ci-dessous
                                    pour vérifier votre adresse email et activer votre compte.
                                </p>

                                <div class="code-section">
                                    <p style="margin: 0 0 12px 0;"><strong>Votre code de vérification:</strong></p>
                                    <div class="verification-code">%s</div>
                                    <p class="expiry-notice">Ce code expire dans <strong>10 minutes</strong>.</p>
                                </div>

                                <div class="security-note">
                                    <strong>🔒 Sécurité:</strong> Cet email a été envoyé suite à une demande d'inscription.
                                    Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                                </div>

                                <div class="footer-text">
                                    <p style="margin: 0;">
                                        <strong>Instructions:</strong>
                                    </p>
                                    <ol style="margin: 8px 0 0 0; padding-left: 20px; color: #666; font-size: 13px;">
                                        <li>Copiez le code de vérification ci-dessus</li>
                                        <li>Retournez à l'écran d'inscription</li>
                                        <li>Collez le code pour confirmer votre email</li>
                                        <li>Complétez votre profil et profitez de PGuard Monitor</li>
                                    </ol>
                                </div>
                            </div>

                            <div class="footer">
                                <p style="margin: 0 0 8px 0;">
                                    PGuard Monitor - Surveillance Robotique Intelligente
                                </p>
                                <p style="margin: 0;">
                                    © 2025 Enova Robotics. Tous droits réservés.
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, code);
    }
}
