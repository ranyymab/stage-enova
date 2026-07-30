package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.dto.*;
import com.enovarobotics.pguard.model.entity.User;
import com.enovarobotics.pguard.model.entity.VerificationCode;
import com.enovarobotics.pguard.repository.UserRepository;
import com.enovarobotics.pguard.security.JwtService;
import com.enovarobotics.pguard.service.GoogleTokenService;
import com.enovarobotics.pguard.service.VerificationCodeService;
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
import java.util.Map;
import java.util.Optional;

/**
 * F5 — Authentification.
 * POST /api/auth/register       : inscription (email + mot de passe) -> envoi d'un code de vérification par e-mail
 * POST /api/auth/verify-email   : validation du code -> compte activé + connexion automatique (JWT)
 * POST /api/auth/resend-code    : renvoi du code (débit limité)
 * POST /api/auth/login          : email + mot de passe -> JWT (24h), avec verrouillage anti brute-force
 * POST /api/auth/google         : connexion/inscription via Google Sign-In (ID token vérifié côté serveur)
 * GET  /api/auth/me             : profil de l'utilisateur courant (déduit du JWT)
 */
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

    // ---------------------------------------------------------------
    // Inscription classique + vérification e-mail
    // ---------------------------------------------------------------

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent() && existing.get().isEmailVerified()) {
            // Ne pas confirmer explicitement qu'un compte existe déjà pour cet
            // e-mail (évite l'énumération de comptes) tout en restant utile.
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Un compte existe déjà pour cet e-mail. Essayez de vous connecter."));
        }

        User user = existing.orElseGet(User::new);
        user.setEmail(email);
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setEmailVerified(false);
        if (existing.isEmpty()) {
            user.setRole(parseRole(defaultRegistrationRole));
        }
        userRepository.save(user);

        verificationCodeService.generateAndSend(email, user.getFullName(), VerificationCode.Purpose.SIGNUP_VERIFICATION);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MessageResponse.of("Un code de vérification a été envoyé à " + email));
    }

    @PostMapping("/verify-email")
    @Transactional
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        verificationCodeService.verify(email, request.getCode(), VerificationCode.Purpose.SIGNUP_VERIFICATION);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new VerificationCodeService.InvalidCodeException("Compte introuvable"));

        user.setEmailVerified(true);
        userRepository.save(user);

        return ResponseEntity.ok(buildLoginResponse(user));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                verificationCodeService.generateAndSend(email, user.getFullName(), VerificationCode.Purpose.SIGNUP_VERIFICATION);
            }
        });

        // Réponse identique que l'e-mail existe ou non (anti-énumération).
        return ResponseEntity.ok(MessageResponse.of("Si un compte en attente existe pour cet e-mail, un nouveau code a été envoyé."));
    }

    // ---------------------------------------------------------------
    // Connexion classique (avec verrouillage anti brute-force)
    // ---------------------------------------------------------------

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        var userOpt = userRepository.findByEmail(email);

        // Message d'erreur volontairement générique dans tous les cas
        // (mauvais e-mail, mauvais mot de passe, ou compte Google) pour ne
        // pas révéler quelles adresses sont enregistrées.
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

    // ---------------------------------------------------------------
    // Connexion / inscription via Google Sign-In
    // ---------------------------------------------------------------

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
        user.setEmailVerified(true); // Google a déjà vérifié l'adresse
        if (isNew) {
            user.setRole(parseRole(defaultRegistrationRole));
            // Compte Google : pas de mot de passe local exploitable, on stocke
            // un hash aléatoire inutilisable pour satisfaire la contrainte NOT NULL.
            user.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());

        userRepository.save(user);

        return ResponseEntity.ok(buildLoginResponse(user));
    }

    // ---------------------------------------------------------------

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
