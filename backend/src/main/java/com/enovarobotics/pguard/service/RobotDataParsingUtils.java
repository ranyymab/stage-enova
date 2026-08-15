package com.enovarobotics.pguard.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Component
public class RobotDataParsingUtils {

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("d-M-yyyy"),
            DateTimeFormatter.ofPattern("yyyy-M-d")
    );

    private static final DateTimeFormatter HOUR_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");

    public LocalDate parseRobotDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try {
                return LocalDate.parse(raw.trim(), fmt);
            } catch (DateTimeParseException ignored) {

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

    public LocalDateTime combine(LocalDate date, LocalTime time) {
        if (date == null) return null;
        return LocalDateTime.of(date, time != null ? time : LocalTime.MIDNIGHT);
    }

    public Double nanToNull(Double value) {
        if (value == null) return null;
        return value.isNaN() ? null : value;
    }

    public Double parseNumericStringOrNull(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
