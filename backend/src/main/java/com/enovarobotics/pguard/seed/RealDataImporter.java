package com.enovarobotics.pguard.seed;

import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import com.enovarobotics.pguard.repository.MissionEventRepository;
import com.enovarobotics.pguard.repository.ObstacleProgressRepository;
import com.enovarobotics.pguard.repository.TeleoperationEventRepository;
import com.enovarobotics.pguard.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
@Slf4j
public class RealDataImporter {

    private final MissionEventRepository missionEventRepository;
    private final DetectionEventRepository detectionEventRepository;
    private final ObstacleProgressRepository obstacleProgressRepository;
    private final TeleoperationEventRepository teleoperationEventRepository;
    private final MissionLikeFileService missionLikeFileService;
    private final ObstacleFileService obstacleFileService;
    private final TeleoperationFileService teleoperationFileService;
    private final KilometrageFileService kilometrageFileService;
    private final DetectionFileService detectionFileService;

    @Value("${app.robot-id:ROBOT-001}")
    private String robotId;

    @Value("${app.data-dir:./data}")
    private String dataDir;

    @Value("${app.real-data-import.enabled:true}")
    private boolean importEnabled;

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    @EventListener(ApplicationReadyEvent.class)
    @Order(1)
    public void importRealData() {
        if (!importEnabled) {
            log.info("Import des donnees reelles desactive (app.real-data-import.enabled=false)");
            return;
        }

        Path root = Paths.get(dataDir);
        if (!Files.isDirectory(root)) {
            log.warn("Dossier de donnees reelles introuvable ({}), import ignore", root.toAbsolutePath());
            return;
        }

        log.info("Import des donnees reelles depuis {}", root.toAbsolutePath());

        int total = 0;
        total += importMissionLike(root.resolve("info/mission"), MissionEvent.EventCategory.MISSION, "mission");
        total += importMissionLike(root.resolve("info/inspecting"), MissionEvent.EventCategory.INSPECTING, "inspecting");
        total += importMissionLike(root.resolve("info/back_home"), MissionEvent.EventCategory.BACK_HOME, "back_home");
        total += importMissionLike(root.resolve("info/docking"), MissionEvent.EventCategory.DOCKING, "docking");
        total += importObstacles(root.resolve("info/obstacles"));
        total += importTeleoperation(root.resolve("info/teleportation"));
        total += importKilometrage(root.resolve("info/kilometrage"));
        total += importDetections(root.resolve("detection"));

        log.info("Import des donnees reelles termine : {} enregistrement(s) traite(s)", total);
    }

    private int importMissionLike(Path dir, MissionEvent.EventCategory category, String label) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            try {
                if (fileDate != null && missionEventRepository.countByCategoryAndEventDate(category, fileDate) > 0) {
                    continue;
                }
                try (InputStream in = Files.newInputStream(file)) {
                    count += missionLikeFileService.parseAndSave(in, category, robotId);
                }
            } catch (IOException e) {
                log.warn("Echec import {} ({}) : {}", label, file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    private int importObstacles(Path dir) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            if (fileDate != null && obstacleProgressRepository.countByEventDate(fileDate) > 0) {
                continue;
            }
            try (InputStream in = Files.newInputStream(file)) {
                count += obstacleFileService.parseAndSave(in, robotId);
            } catch (IOException e) {
                log.warn("Echec import obstacles ({}) : {}", file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    private int importTeleoperation(Path dir) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            if (fileDate != null && teleoperationEventRepository.countByEventDate(fileDate) > 0) {
                continue;
            }
            try (InputStream in = Files.newInputStream(file)) {
                count += teleoperationFileService.parseAndSave(in, robotId);
            } catch (IOException e) {
                log.warn("Echec import teleoperation ({}) : {}", file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    private int importKilometrage(Path dir) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            if (fileDate == null) {
                log.warn("Nom de fichier kilometrage sans date valide, ignore : {}", file.getFileName());
                continue;
            }
            try (InputStream in = Files.newInputStream(file)) {
                kilometrageFileService.parseAndUpsert(in, robotId, fileDate);
                count++;
            } catch (IOException e) {
                log.warn("Echec import kilometrage ({}) : {}", file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    private int importDetections(Path dir) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            if (fileDate == null) {
                log.warn("Nom de fichier detection sans date valide, ignore : {}", file.getFileName());
                continue;
            }
            if (detectionEventRepository.countByEventDate(fileDate) > 0) {
                continue;
            }
            try (InputStream in = Files.newInputStream(file)) {
                count += detectionFileService.parseAndSave(in, robotId, fileDate);
            } catch (IOException e) {
                log.warn("Echec import detection ({}) : {}", file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    private List<Path> listJsonFiles(Path dir) {
        if (!Files.isDirectory(dir)) {
            return List.of();
        }
        try (Stream<Path> stream = Files.list(dir)) {
            return stream
                    .filter(p -> p.getFileName().toString().toLowerCase().endsWith(".json"))
                    .sorted(Comparator.comparing(p -> p.getFileName().toString()))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.warn("Impossible de lister {} : {}", dir, e.getMessage());
            return List.of();
        }
    }

    private LocalDate dateFromFileName(Path file) {
        String name = file.getFileName().toString();
        String withoutExt = name.endsWith(".json") ? name.substring(0, name.length() - 5) : name;
        try {
            return LocalDate.parse(withoutExt, FILE_DATE);
        } catch (Exception e) {
            return null;
        }
    }
}
