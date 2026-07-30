package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Code à usage unique envoyé par e-mail (vérification d'inscription).
 * Le code n'est JAMAIS stocké en clair : seul son hash BCrypt est persisté,
 * exactement comme pour les mots de passe. Une entrée est à usage unique et
 * expire après une courte durée (cf. VerificationCodeService).
 */
@Entity
@Table(name = "verification_code")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    /** Hash BCrypt du code à 6 chiffres, jamais le code en clair. */
    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Purpose purpose;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Nombre de tentatives de saisie incorrectes (protection brute-force). */
    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean consumed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public enum Purpose {
        SIGNUP_VERIFICATION
    }
}
