package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.DetectionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
public class AnomaliesController {

    private final DetectionEventRepository repository;

    @GetMapping
    public List<DetectionEvent> getAnomalies(
            @RequestParam(required = false) DetectionEvent.StatutAnomalie statut,
            @RequestParam(required = false) DetectionEvent.Criticite criticite,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date
    ) {

        List<DetectionEvent> all = date != null
                ? repository.findByEventDateOrderByEventDatetimeDesc(date)
                : repository.findByEventDateLessThanEqualOrderByEventDatetimeDesc(java.time.LocalDate.now());

        return all.stream()
                .filter(a -> statut == null || a.getStatut() == statut)
                .filter(a -> criticite == null || a.getCriticite() == criticite)
                .toList();
    }

    @PutMapping("/{id}/traiter")
    public ResponseEntity<?> traiter(@PathVariable Long id) {
        var anomalieOpt = repository.findById(id);

        if (anomalieOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Anomalie introuvable : " + id));
        }

        DetectionEvent anomalie = anomalieOpt.get();

        DetectionEvent.StatutAnomalie next = switch (anomalie.getStatut()) {
            case NOUVELLE -> DetectionEvent.StatutAnomalie.EN_COURS;
            case EN_COURS -> DetectionEvent.StatutAnomalie.RESOLUE;
            case RESOLUE -> DetectionEvent.StatutAnomalie.RESOLUE;
        };

        anomalie.setStatut(next);
        repository.save(anomalie);

        return ResponseEntity.ok(anomalie);
    }
}
