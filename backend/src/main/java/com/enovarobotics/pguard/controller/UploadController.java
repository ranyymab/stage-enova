package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final MissionLikeFileService missionLikeFileService;
    private final ObstacleFileService obstacleFileService;
    private final TeleoperationFileService teleoperationFileService;
    private final KilometrageFileService kilometrageFileService;
    private final DetectionFileService detectionFileService;

    @Value("${app.robot-id:ROBOT-001}")
    private String defaultRobotId;

    @PostMapping("/{categorie}")
    public ResponseEntity<?> upload(
            @PathVariable String categorie,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "robotId", required = false) String robotId,
            @RequestParam(value = "date", required = false) String dateParam
    ) {
        String effectiveRobotId = (robotId != null && !robotId.isBlank()) ? robotId : defaultRobotId;

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        try {
            int count;
            switch (categorie.toLowerCase()) {
                case "mission" -> count = missionLikeFileService.parseAndSave(
                        file.getInputStream(), MissionEvent.EventCategory.MISSION, effectiveRobotId);
                case "inspecting" -> count = missionLikeFileService.parseAndSave(
                        file.getInputStream(), MissionEvent.EventCategory.INSPECTING, effectiveRobotId);
                case "back_home" -> count = missionLikeFileService.parseAndSave(
                        file.getInputStream(), MissionEvent.EventCategory.BACK_HOME, effectiveRobotId);
                case "docking" -> count = missionLikeFileService.parseAndSave(
                        file.getInputStream(), MissionEvent.EventCategory.DOCKING, effectiveRobotId);
                case "obstacle" -> count = obstacleFileService.parseAndSave(file.getInputStream(), effectiveRobotId);
                case "teleoperation" -> count = teleoperationFileService.parseAndSave(file.getInputStream(), effectiveRobotId);
                case "kilometrage" -> {
                    LocalDate date = resolveDate(dateParam);
                    kilometrageFileService.parseAndUpsert(file.getInputStream(), effectiveRobotId, date);
                    count = 1;
                }
                case "detection" -> {
                    LocalDate date = resolveDate(dateParam);
                    count = detectionFileService.parseAndSave(file.getInputStream(), effectiveRobotId, date);
                }
                default -> {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Catégorie inconnue : " + categorie,
                            "categoriesValides", new String[]{
                                    "mission", "inspecting", "back_home", "docking",
                                    "obstacle", "teleoperation", "kilometrage", "detection"
                            }
                    ));
                }
            }

            return ResponseEntity.ok(Map.of(
                    "categorie", categorie,
                    "robotId", effectiveRobotId,
                    "enregistrementsTraites", count
            ));

        } catch (IOException e) {
            log.warn("Échec du parsing JSON pour la catégorie {} : {}", categorie, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "Fichier JSON malformé ou illisible",
                    "details", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'upload {} : {}", categorie, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Erreur interne lors du traitement du fichier"
            ));
        }
    }

    private LocalDate resolveDate(String dateParam) {
        if (dateParam == null || dateParam.isBlank()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(dateParam);
        } catch (Exception e) {
            return LocalDate.now();
        }
    }
}
