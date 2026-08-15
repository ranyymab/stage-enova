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
