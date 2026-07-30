package com.enovarobotics.pguard.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Vérifie côté serveur les jetons ID renvoyés par Google Identity Services
 * (bouton "Se connecter avec Google" côté Angular).
 *
 * Sécurité — ce qui est vérifié pour CHAQUE jeton :
 *  1. La signature RS256, avec les clés publiques Google (téléchargées et
 *     mises en cache par GoogleIdTokenVerifier, jamais codées en dur).
 *  2. L'émetteur ("iss") == accounts.google.com.
 *  3. L'audience ("aud") == notre Client ID Google (google.oauth.client-id),
 *     ce qui empêche un jeton émis pour une AUTRE application d'être
 *     accepté ici.
 *  4. L'expiration ("exp") avec une tolérance d'horloge de 5 minutes.
 * Ne JAMAIS faire confiance à un ID token reçu du frontend sans cette
 * vérification serveur — le frontend n'est pas une source fiable.
 */
@Service
@Slf4j
public class GoogleTokenService {

    @Value("${app.google.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    void init() {
        if (googleClientId == null || googleClientId.isBlank()) {
            log.warn("app.google.client-id n'est pas configuré : la connexion Google est désactivée.");
            return;
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    public boolean isConfigured() {
        return verifier != null;
    }

    /**
     * Vérifie le jeton et retourne son contenu (email, nom, sub) si valide.
     * Retourne empty si le jeton est invalide, expiré, ou destiné à une
     * autre application (mauvaise audience).
     */
    public java.util.Optional<GoogleIdToken.Payload> verify(String idTokenString) {
        if (!isConfigured()) {
            throw new IllegalStateException("La connexion Google n'est pas configurée sur ce serveur");
        }
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return java.util.Optional.empty();
            }
            return java.util.Optional.of(idToken.getPayload());
        } catch (GeneralSecurityException | java.io.IOException | IllegalArgumentException e) {
            log.warn("Échec de vérification du jeton Google : {}", e.getMessage());
            return java.util.Optional.empty();
        }
    }
}
