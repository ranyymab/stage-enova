package com.enovarobotics.pguard.controller;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardControllerTest {

    @Test
    void shouldSeedTodayAndUpcomingDates() {
        List<LocalDate> dates = DashboardController.datesToSeed(LocalDate.of(2026, 7, 2));

        assertEquals(List.of(
                LocalDate.of(2026, 7, 2),
                LocalDate.of(2026, 7, 3),
                LocalDate.of(2026, 7, 4),
                LocalDate.of(2026, 7, 5),
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 7),
                LocalDate.of(2026, 7, 8),
                LocalDate.of(2026, 7, 9)
        ), dates);
    }
}
