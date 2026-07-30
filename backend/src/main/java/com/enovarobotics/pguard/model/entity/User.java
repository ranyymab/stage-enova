package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité utilisateur — F5 Authentification JWT.
 * Le mot de passe n'est JAMAIS stocké en clair : seul le hash BCrypt
 * (généré par PasswordEncoder côté service) est persisté.
 */
@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "full_name", length = 150)
    private String fullName;

    /** Hash BCrypt, jamais le mot de passe en clair */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.OPERATEUR;

    /** Faux tant que le code envoyé par e-mail n'a pas été validé (F5 bis). */
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    /** LOCAL = email/mot de passe, GOOGLE = compte créé via Google Sign-In. */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    /** Identifiant unique Google ("sub" du token) pour les comptes GOOGLE. */
    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    /** Compteur de tentatives de connexion échouées consécutives (verrouillage). */
    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    /** Si renseigné et dans le futur, le compte est temporairement verrouillé. */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Role {
        ADMINISTRATEUR, OPERATEUR
    }

    public enum AuthProvider {
        LOCAL, GOOGLE
    }
}
