package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.repository.MissionEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * F2 — GET /api/mission : historique des missions, filtrable par date et
 * par categorie (MISSION par defaut, pour compatibilite avec les appels
 * existants qui ne precisent pas de categorie).
 */
@RestController
@RequestMapping("/api/mission")
@RequiredArgsConstructor
public class MissionController {

    private final MissionEventRepository repository;

    @GetMapping
    public List<MissionEvent> getMissions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "MISSION") MissionEvent.EventCategory category
    ) {
        if (date != null) {
            return repository.findByCategoryAndEventDateOrderByEventDatetimeAsc(category, date);
        }
        return repository.findByCategoryOrderByEventDatetimeDesc(category);
    }
}
