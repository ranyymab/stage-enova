package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.ObstacleProgress;
import com.enovarobotics.pguard.repository.ObstacleProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * F2 — GET /api/inspection : historique des points d'inspection.
 *
 * Note : sert les données de la table obstacle_progress (catégorie réelle
 * "Obstacle"), qui correspond fonctionnellement au suivi d'inspection
 * décrit dans le cahier des charges (Last_point/Delay). Voir
 * ObstacleProgress.java pour le détail de cet écart de nommage.
 */
@RestController
@RequestMapping("/api/inspection")
@RequiredArgsConstructor
public class InspectionController {

    private final ObstacleProgressRepository repository;

    @GetMapping
    public List<ObstacleProgress> getInspectionPoints(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (date != null) {
            return repository.findByEventDateOrderByEventDatetimeAsc(date);
        }
        // Garde-fou : jamais un point d'inspection date dans le futur, et plus
        // de limite arbitraire a 20 lignes (voir AnomaliesController, meme
        // correctif).
        return repository.findByEventDateLessThanEqualOrderByEventDatetimeDesc(LocalDate.now());
    }
}
