package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.TeleoperationEvent;
import com.enovarobotics.pguard.repository.TeleoperationEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * F2 — GET /api/teleportation : historique des sessions de téléopération.
 * (nom d'URL conservé tel que spécifié dans le cahier des charges, malgré
 * la coquille "teleportation" pour "téléopération")
 */
@RestController
@RequestMapping("/api/teleportation")
@RequiredArgsConstructor
public class TeleoperationController {

    private final TeleoperationEventRepository repository;

    @GetMapping
    public List<TeleoperationEvent> getSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (date != null) {
            return repository.findByEventDateOrderByEventDatetimeAsc(date);
        }
        return repository.findByEventDateOrderByEventDatetimeAsc(LocalDate.now());
    }
}
