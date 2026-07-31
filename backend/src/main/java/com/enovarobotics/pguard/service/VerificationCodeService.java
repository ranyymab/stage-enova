package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.entity.VerificationCode;
import com.enovarobotics.pguard.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Génère, envoie et vérifie les codes à usage unique (OTP) pour la
 * confirmation d'adresse e-mail à l'inscription.
 * - Code à 6 chiffres généré avec SecureRandom (jamais Math.random).
 * - Stocké uniquement sous forme de hash BCrypt (jamais en clair, comme un mot de passe).
 * - Expire après 10 minutes.
 * - Maximum 5 tentatives de saisie avant invalidation (anti brute-force).
 * - Renvoi limité à 1 fois par 60 secondes (anti spam / anti abus e-mail).
 */
@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationCodeRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.verification.code-ttl-minutes:10}")
    private long ttlMinutes;

    @Value("${app.verification.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    /**
     * Genere et envoie un nouveau code. Retourne {@code null} si l'e-mail a
     * reellement ete envoye par SMTP (cas normal), ou renvoie le code
     * lui-meme si l'envoi a echoue et que le repli developpement
     * (app.mail.log-code-fallback) est actif, pour que l'appelant puisse
     * l'exposer directement dans la reponse API plutot que de laisser
     * croire a un envoi reussi.
     */
    @Transactional
    public String generateAndSend(String email, String fullName, VerificationCode.Purpose purpose) {
        repository.findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(email, purpose)
                .ifPresent(existing -> {
                    long secondsSinceLast = Duration.between(existing.getCreatedAt(), LocalDateTime.now()).getSeconds();
                    if (secondsSinceLast < resendCooldownSeconds) {
                        throw new TooManyRequestsException(
                                "Veuillez patienter avant de redemander un code (" +
                                        (resendCooldownSeconds - secondsSinceLast) + "s restantes)");
                    }
                });

        repository.invalidateActiveCodes(email, purpose);

        String code = generateSixDigitCode();

        VerificationCode entity = VerificationCode.builder()
                .email(email)
                .codeHash(passwordEncoder.encode(code))
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plus(ttlMinutes, ChronoUnit.MINUTES))
                .attempts(0)
                .consumed(false)
                .build();

        repository.save(entity);
        boolean actuallySent = emailService.sendVerificationCode(email, fullName, code);
        if (actuallySent) {
            return null;
        }
        // Envoi réel échoué (SMTP non configuré ou en erreur) : on n'expose le
        // code au client que si le mode démo/dev est explicitement actif
        // (app.mail.log-code-fallback). Sinon, l'inscription réussit quand
        // même (jamais bloquée par un souci SMTP) mais le code ne part que
        // dans les logs serveur, comme en production réelle.
        return emailService.isLogCodeFallbackEnabled() ? code : null;
    }

    @Transactional
    public boolean verify(String email, String rawCode, VerificationCode.Purpose purpose) {
        VerificationCode entity = repository
                .findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new InvalidCodeException("Aucun code actif. Veuillez en redemander un."));

        if (entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            entity.setConsumed(true);
            repository.save(entity);
            throw new InvalidCodeException("Ce code a expiré. Veuillez en redemander un.");
        }

        if (entity.getAttempts() >= MAX_ATTEMPTS) {
            entity.setConsumed(true);
            repository.save(entity);
            throw new InvalidCodeException("Trop de tentatives incorrectes. Veuillez redemander un nouveau code.");
        }

        if (!passwordEncoder.matches(rawCode, entity.getCodeHash())) {
            entity.setAttempts(entity.getAttempts() + 1);
            repository.save(entity);
            throw new InvalidCodeException("Code incorrect.");
        }

        entity.setConsumed(true);
        repository.save(entity);
        return true;
    }

    private String generateSixDigitCode() {
        int value = RANDOM.nextInt(900_000) + 100_000; // 100000-999999
        return String.valueOf(value);
    }

    public static class InvalidCodeException extends RuntimeException {
        public InvalidCodeException(String message) {
            super(message);
        }
    }

    public static class TooManyRequestsException extends RuntimeException {
        public TooManyRequestsException(String message) {
            super(message);
        }
    }
}
