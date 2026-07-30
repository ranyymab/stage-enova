package com.enovarobotics.pguard.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Reçoit le "credential" (ID token JWT signé par Google) renvoyé par le
 * bouton Google Identity Services côté Angular. Ce jeton est vérifié
 * côté serveur (signature + audience + émetteur) avant toute confiance —
 * voir GoogleTokenService.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {

    @NotBlank
    private String idToken;
}
