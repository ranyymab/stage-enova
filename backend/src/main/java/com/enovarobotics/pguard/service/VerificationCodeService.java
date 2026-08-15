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

        return emailService.isLogCodeFallbackEnabled() ? code : null;
    }

    @Transactional
    public void verify(String email, String rawCode, VerificationCode.Purpose purpose) {
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
            int remaining = MAX_ATTEMPTS - entity.getAttempts();
            throw new InvalidCodeException("Code incorrect. " + remaining + " tentative" + (remaining > 1 ? "s" : "") + " restante" + (remaining > 1 ? "s" : "") + ".");
        }

        entity.setConsumed(true);
        repository.save(entity);
    }

    public CodeMetadata getCodeMetadata(String email, VerificationCode.Purpose purpose) {
        return repository
                .findTopByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(email, purpose)
                .map(entity -> {
                    long expirySeconds = Duration.between(LocalDateTime.now(), entity.getExpiresAt()).getSeconds();
                    int attemptsRemaining = Math.max(0, MAX_ATTEMPTS - entity.getAttempts());
                    return new CodeMetadata((int) Math.max(0, expirySeconds), attemptsRemaining, MAX_ATTEMPTS);
                })
                .orElseThrow(() -> new InvalidCodeException("Aucun code actif."));
    }

    public static class CodeMetadata {
        public final int expirySeconds;
        public final int attemptsRemaining;
        public final int maxAttempts;

        public CodeMetadata(int expirySeconds, int attemptsRemaining, int maxAttempts) {
            this.expirySeconds = expirySeconds;
            this.attemptsRemaining = attemptsRemaining;
            this.maxAttempts = maxAttempts;
        }
    }

    private String generateSixDigitCode() {
        int value = RANDOM.nextInt(900_000) + 100_000;
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
