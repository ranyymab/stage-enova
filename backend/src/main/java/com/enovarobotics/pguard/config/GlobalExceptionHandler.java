package com.enovarobotics.pguard.config;

import com.enovarobotics.pguard.service.VerificationCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage()));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", "Requête invalide");
        response.put("code", "VALIDATION_ERROR");
        response.put("fields", errors);
        response.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(VerificationCodeService.InvalidCodeException.class)
    public ResponseEntity<?> handleInvalidCode(VerificationCodeService.InvalidCodeException ex) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", ex.getMessage());
        response.put("code", "INVALID_CODE");
        response.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        log.warn("Invalid code attempt: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(VerificationCodeService.TooManyRequestsException.class)
    public ResponseEntity<?> handleTooManyRequests(VerificationCodeService.TooManyRequestsException ex) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", ex.getMessage());
        response.put("code", "TOO_MANY_REQUESTS");
        response.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        log.warn("Too many requests: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", "Argument invalide");
        response.put("code", "ILLEGAL_ARGUMENT");
        response.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", "Une erreur inattendue est survenue");
        response.put("code", "INTERNAL_SERVER_ERROR");
        response.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        log.error("Erreur inattendue", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
