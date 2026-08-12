package com.enovarobotics.pguard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Réponse améliorée pour les opérations de vérification d'e-mail.
 * Fournit des métadonnées utiles au frontend pour afficher un UX approprié.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationResponse {
    
    // Status message
    private String message;
    
    // Metadata for frontend
    private int codeExpirySeconds;      // Combien de secondes avant expiry du code
    private int maxAttempts;             // Nombre max de tentatives avant blocage
    private int attemptsRemaining;       // Tentatives restantes
    private long resendCooldownSeconds;  // Cooldown avant de pouvoir renvoyer
    
    // Dev only
    private String devCode;              // Code de test (uniquement en dev si SMTP non configuré)
    
    public static VerificationResponse success(String message, int codeExpirySeconds, 
                                              int maxAttempts, int attemptsRemaining,
                                              long resendCooldown, String devCode) {
        return VerificationResponse.builder()
                .message(message)
                .codeExpirySeconds(codeExpirySeconds)
                .maxAttempts(maxAttempts)
                .attemptsRemaining(attemptsRemaining)
                .resendCooldownSeconds(resendCooldown)
                .devCode(devCode)
                .build();
    }
    
    public static VerificationResponse success(String message, int codeExpirySeconds) {
        return VerificationResponse.builder()
                .message(message)
                .codeExpirySeconds(codeExpirySeconds)
                .maxAttempts(5)
                .attemptsRemaining(5)
                .resendCooldownSeconds(60)
                .build();
    }
}
