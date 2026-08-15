package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.dto.*;
import com.enovarobotics.pguard.model.entity.User;
import com.enovarobotics.pguard.model.entity.VerificationCode;
import com.enovarobotics.pguard.repository.UserRepository;
import com.enovarobotics.pguard.security.JwtService;
import com.enovarobotics.pguard.service.GoogleTokenService;
import com.enovarobotics.pguard.service.VerificationCodeService;
import com.enovarobotics.pguard.service.VerificationCodeService.CodeMetadata;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationCodeService verificationCodeService;
    private final GoogleTokenService googleTokenService;

    @Value("${app.registration.default-role:OPERATEUR}")
    private String defaultRegistrationRole;

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Un compte existe déjà pour cet e-mail. Essayez de vous connecter."));
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        // Email verification has been removed: accounts are active immediately.
        user.setEmailVerified(true);
        user.setRole(parseRole(defaultRegistrationRole));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Account created immediately (no email verification) for: {}", email);

        return ResponseEntity.status(HttpStatus.CREATED).body(buildLoginResponse(user));
    }

    @PostMapping("/verify-email")
    @Transactional
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        try {
            verificationCodeService.verify(email, request.getCode(), VerificationCode.Purpose.SIGNUP_VERIFICATION);
        } catch (VerificationCodeService.InvalidCodeException e) {

            try {
                CodeMetadata metadata = verificationCodeService.getCodeMetadata(email, VerificationCode.Purpose.SIGNUP_VERIFICATION);
                Map<String, Object> errorResponse = new LinkedHashMap<>();
                errorResponse.put("error", e.getMessage());
                errorResponse.put("attemptsRemaining", metadata.attemptsRemaining);
                errorResponse.put("code", "INVALID_CODE");
                return ResponseEntity.badRequest().body(errorResponse);
            } catch (Exception ignored) {

                throw e;
            }
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new VerificationCodeService.InvalidCodeException("Compte introuvable"));

        user.setEmailVerified(true);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        log.info("Email verified successfully for: {}", email);
        return ResponseEntity.ok(buildLoginResponse(user));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .filter(u -> !u.isEmailVerified())
                .orElseThrow(() -> new IllegalArgumentException("Email not found or already verified"));

        String devCode = verificationCodeService.generateAndSend(email, user.getFullName(), VerificationCode.Purpose.SIGNUP_VERIFICATION);
        CodeMetadata metadata = verificationCodeService.getCodeMetadata(email, VerificationCode.Purpose.SIGNUP_VERIFICATION);

        if (devCode != null) {
            log.warn("SMTP not configured: dev code returned for {}", email);
            return ResponseEntity.ok(VerificationResponse.success(
                    "Code de test (mode développement): " + devCode,
                    metadata.expirySeconds,
                    metadata.maxAttempts,
                    metadata.attemptsRemaining,
                    60,
                    devCode));
        }

        return ResponseEntity.ok(VerificationResponse.success(
                "Un nouveau code a été envoyé à " + email,
                metadata.expirySeconds,
                metadata.maxAttempts,
                metadata.attemptsRemaining,
                60,
                null));
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        var userOpt = userRepository.findByEmail(email);

        Map<String, String> genericError = Map.of("error", "Email ou mot de passe incorrect");

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(genericError);
        }

        User user = userOpt.get();

        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Ce compte utilise la connexion Google. Utilisez le bouton \"Continuer avec Google\"."));
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(Map.of("error", "Compte temporairement verrouillé suite à plusieurs échecs. Réessayez plus tard."));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            registerFailedAttempt(user);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(genericError);
        }

        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Adresse e-mail non vérifiée. Consultez votre boîte mail pour le code de vérification."));
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(buildLoginResponse(user));
    }

    private void registerFailedAttempt(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            log.warn("Compte {} verrouillé {} minutes après {} échecs", user.getEmail(), LOCKOUT_MINUTES, attempts);
        }
        userRepository.save(user);
    }

    @PostMapping("/google")
    @Transactional
    public ResponseEntity<?> google(@Valid @RequestBody GoogleLoginRequest request) {
        if (!googleTokenService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "La connexion Google n'est pas configurée sur ce serveur."));
        }

        Optional<GoogleIdToken.Payload> payloadOpt = googleTokenService.verify(request.getIdToken());

        if (payloadOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Jeton Google invalide."));
        }

        GoogleIdToken.Payload payload = payloadOpt.get();

        Boolean emailVerifiedByGoogle = payload.getEmailVerified();
        if (emailVerifiedByGoogle == null || !emailVerifiedByGoogle) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "L'adresse e-mail associée à ce compte Google n'est pas vérifiée."));
        }

        String googleId = payload.getSubject();
        String email = ((String) payload.getEmail()).toLowerCase().trim();
        String name = (String) payload.get("name");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElseGet(User::new);

        boolean isNew = user.getId() == null;

        user.setGoogleId(googleId);
        user.setEmail(email);
        if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(name != null ? name : email);
        }
        user.setAuthProvider(User.AuthProvider.GOOGLE);
        user.setEmailVerified(true);
        if (isNew) {
            user.setRole(parseRole(defaultRegistrationRole));

            user.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());

        userRepository.save(user);

        return ResponseEntity.ok(buildLoginResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of(
                        "email", user.getEmail(),
                        "fullName", user.getFullName() == null ? "" : user.getFullName(),
                        "role", user.getRole().name(),
                        "authProvider", user.getAuthProvider().name()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private LoginResponse buildLoginResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .expiresInMs(jwtService.getExpirationMs())
                .build();
    }

    private User.Role parseRole(String value) {
        try {
            return User.Role.valueOf(value);
        } catch (Exception e) {
            return User.Role.OPERATEUR;
        }
    }
}
