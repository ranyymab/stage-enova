package com.enovarobotics.pguard.config;

import com.enovarobotics.pguard.service.EmailService;
import com.enovarobotics.pguard.service.VerificationCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Gestion centralisée des erreurs — F5 sécurité.
 * Objectif : ne jamais renvoyer de stack trace ou de détail interne au
 * client (fuite d'information), tout en donnant un message exploitable.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("error", "Requête invalide", "fields", errors));
    }

    @ExceptionHandler(VerificationCodeService.InvalidCodeException.class)
    public ResponseEntity<?> handleInvalidCode(VerificationCodeService.InvalidCodeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(VerificationCodeService.TooManyRequestsException.class)
    public ResponseEntity<?> handleTooManyRequests(VerificationCodeService.TooManyRequestsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(EmailService.EmailDeliveryException.class)
    public ResponseEntity<?> handleEmailFailure(EmailService.EmailDeliveryException ex) {
        log.error("Erreur d'envoi d'e-mail", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        log.error("Erreur inattendue", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Une erreur inattendue est survenue."));
    }
}
