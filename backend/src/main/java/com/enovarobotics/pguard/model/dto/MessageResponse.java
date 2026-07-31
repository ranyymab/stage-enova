package com.enovarobotics.pguard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;

    /**
     * Rempli UNIQUEMENT quand app.mail.log-code-fallback est actif ET que
     * l'envoi SMTP réel a échoué (ex: aucun compte SMTP configuré en
     * développement) — jamais en conditions normales de production, où le
     * code ne transite que par e-mail. Sans ce champ, l'inscription
     * "réussissait" silencieusement même quand aucun e-mail ne partait
     * réellement, ce qui rendait le flux impossible à tester sans accès
     * aux logs serveur.
     */
    private String devCode;

    public static MessageResponse of(String message) {
        return new MessageResponse(message, null);
    }

    public static MessageResponse of(String message, String devCode) {
        return new MessageResponse(message, devCode);
    }
}
