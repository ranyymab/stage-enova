package com.enovarobotics.pguard.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Utilitaires de parsing partagés par tous les services de catégorie.
 *
 * Gère deux écarts réels observés (cf. note dans le cahier des charges,
 * confirmée sur des fichiers réels) :
 *  - Format de date variable : "AAAA-MM-JJ" (fichiers 2024, avec zéros de
 *    tête) OU "J-M-AAAA" / "JJ-M-AAAA" (fichiers plus récents, sans zéro
 *    de tête sur jour/mois).
 *  - Latitude/Longitude NaN (absence de fix GPS) -> converti en null avant
 *    persistance, jamais rejeté.
 */
@Component
public class RobotDataParsingUtils {

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),   // 2024-06-25
            DateTimeFormatter.ofPattern("d-M-yyyy"),       // 1-10-2024 ou 4-6-2026
            DateTimeFormatter.ofPattern("yyyy-M-d")        // tolérance supplémentaire
    );

    private static final DateTimeFormatter HOUR_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");

    /**
     * Parse une date robot en essayant plusieurs formats connus.
     * Retourne null si aucun format ne correspond, plutôt que de lever une
     * exception qui ferait échouer tout l'upload pour un seul enregistrement.
     */
    public LocalDate parseRobotDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try {
                return LocalDate.parse(raw.trim(), fmt);
            } catch (DateTimeParseException ignored) {
                // essai du format suivant
            }
        }
        return null;
    }

    public LocalTime parseRobotHour(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalTime.parse(raw.trim(), HOUR_FORMAT);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /** Concatène Date + Hour (séparés dans les fichiers robot) en un LocalDateTime unique. */
    public LocalDateTime combine(LocalDate date, LocalTime time) {
        if (date == null) return null;
        return LocalDateTime.of(date, time != null ? time : LocalTime.MIDNIGHT);
    }

    /** Convertit NaN en null ; laisse passer toute autre valeur (y compris null) inchangée. */
    public Double nanToNull(Double value) {
        if (value == null) return null;
        return value.isNaN() ? null : value;
    }

    /**
     * Parse un champ "Distance"/"Delay" qui peut être soit un nombre sous
     * forme de chaîne (ex: "0.907498888467"), soit la chaîne littérale
     * "Unknown"/"None" -> retourne null dans ce dernier cas plutôt que de
     * lever une exception.
     */
    public Double parseNumericStringOrNull(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return null; // "Unknown", "None", etc.
        }
    }
}
