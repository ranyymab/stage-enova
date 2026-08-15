package com.enovarobotics.pguard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationResponse {

    private String message;

    private int codeExpirySeconds;
    private int maxAttempts;
    private int attemptsRemaining;
    private long resendCooldownSeconds;

    private String devCode;

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
