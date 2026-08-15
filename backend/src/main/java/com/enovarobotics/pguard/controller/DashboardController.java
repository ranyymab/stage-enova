package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.DetectionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import com.enovarobotics.pguard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final DetectionEventRepository detectionEventRepository;

    @GetMapping("/kpi")
    public Map<String, Object> getKpi(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        ensureTodayDataFiles(reference);
        return dashboardService.buildKpi(reference);
    }

    @GetMapping("/statut")
    public Map<String, Object> getStatut(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        Map<String, Object> kpi = dashboardService.buildKpi(reference);
        Map<String, Object> result = new HashMap<>();
        result.put("statut", kpi.get("statutMission"));
        result.put("missionEnCours", kpi.getOrDefault("missionEnCours", ""));
        return result;
    }

    @GetMapping("/robot-live")
    public Map<String, Object> getRobotLive(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        ensureTodayDataFiles(reference);
        return dashboardService.buildRobotLive(reference);
    }

    @GetMapping("/trajectory")
    public List<Map<String, Object>> getTrajectory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildTrajectory(reference);
    }

    @GetMapping("/charge-cycles")
    public List<Map<String, Object>> getChargeCycles(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildChargeCycles(reference);
    }

    @GetMapping("/distance-par-jour")
    public List<Map<String, Object>> getDistanceParJour() {
        return dashboardService.buildDistanceParJour();
    }

    @GetMapping("/repartition-temps")
    public Map<String, Object> getRepartitionTemps(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildRepartitionTemps(reference);
    }

    @GetMapping("/missions-du-jour")
    public List<Map<String, Object>> getTimeline(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildTimeline(reference);
    }

    @GetMapping("/activity-feed")
    public List<Map<String, Object>> getActivityFeed(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildActivityFeed(reference);
    }

    @GetMapping("/inspection-points")
    public List<Map<String, Object>> getInspectionPoints(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        return dashboardService.buildInspectionPoints(reference);
    }

    @GetMapping("/anomalies-recentes")
    public List<Map<String, Object>> getAnomaliesRecentes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reference = dashboardService.resolveReferenceDate(date);
        ensureTodayDataFiles(reference);
        return dashboardService.buildAnomaliesRecentes(reference);
    }

    private void ensureTodayDataFiles(LocalDate referenceDate) {
        if (referenceDate == null) {
            return;
        }
        try {
            Path root = Paths.get("./data");
            Files.createDirectories(root);
            for (LocalDate date : datesToSeed(referenceDate)) {
                String iso = date.toString();
                createIfMissing(root.resolve("info/mission/" + iso + ".json"), "[]");
                createIfMissing(root.resolve("info/teleportation/" + iso + ".json"), "[]");
                createIfMissing(root.resolve("info/obstacles/" + iso + ".json"), "[]");
                createIfMissing(root.resolve("info/kilometrage/" + iso + ".json"), "{\"lastUpdate\":\"00:00:00\",\"distanceKm\":0.0,\"dynamicPercentage\":0.0,\"dynamicMinutes\":0.0,\"staticMinutes\":0.0,\"totalMinutes\":0.0}");
                createIfMissing(root.resolve("detection/" + iso + ".json"), "[]");
            }
        } catch (Exception ignored) {
        }
    }

    static List<LocalDate> datesToSeed(LocalDate referenceDate) {
        LocalDate start = referenceDate != null ? referenceDate : LocalDate.now();
        List<LocalDate> dates = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            dates.add(start.plusDays(i));
        }
        return dates;
    }

    private void createIfMissing(Path path, String content) throws java.io.IOException {
        if (Files.exists(path)) {
            return;
        }
        Files.createDirectories(path.getParent());
        Files.writeString(path, content);
    }

    @PutMapping("/anomalies/{id}/statut")
    public ResponseEntity<?> updateAnomalyStatus(
            @PathVariable Long id,
            @RequestParam DetectionEvent.StatutAnomalie statut
    ) {
        return detectionEventRepository.findById(id)
                .map(anomalie -> {
                    anomalie.setStatut(statut);
                    detectionEventRepository.save(anomalie);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
