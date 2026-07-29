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

/**
 * Importe au demarrage les VRAIS fichiers JSON du robot, places sur disque
 * sous app.data-dir (par defaut ./data, voir application.properties), en
 * reutilisant exactement les memes services de parsing que
 * UploadController (aucune logique de parsing dupliquee/divergente).
 *
 * Sans cet import, seules les donnees factices de DataSeeder existent en
 * base (DataSeeder ne s'execute que si la base est vide, mais il ne sait
 * rien des fichiers reels sur disque) : kilometrage, missions, etc.
 * affiches dans le dashboard ne correspondaient alors a aucun fichier JSON
 * reel, d'ou l'ecart constate.
 *
 * Idempotent : chaque fichier mission-like n'est reimporte que si aucun
 * enregistrement de cette categorie n'existe deja pour sa date (le
 * kilometrage est un upsert par nature, donc toujours rejouable sans
 * duplication).
 *
 * @Order(1) : s'execute avant DataSeeder (@Order par defaut / non annote =
 * dernier), pour que la base ne soit plus "vide" quand DataSeeder verifie
 * sa condition de garde, evitant l'ajout de donnees factices en plus des
 * donnees reelles.
 */
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
                    continue; // deja importe lors d'un demarrage precedent
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
                continue; // deja importe lors d'un demarrage precedent
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
                continue; // deja importe lors d'un demarrage precedent
            }
            try (InputStream in = Files.newInputStream(file)) {
                count += teleoperationFileService.parseAndSave(in, robotId);
            } catch (IOException e) {
                log.warn("Echec import teleoperation ({}) : {}", file.getFileName(), e.getMessage());
            }
        }
        return count;
    }

    /** Kilometrage : upsert par nature (rejouable sans creer de doublons), date deduite du nom de fichier. */
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

    /**
     * Detection : seul le dossier detection/AAAA-MM-JJ.json (format hour/objectDetected/gps/image)
     * est importe. Le fichier detections.json a la racine de data/ suit un schema different
     * (deja au format entite, probablement un echantillon hors robot) et n'est pas compatible
     * avec DetectionEventDto : il est volontairement ignore pour eviter d'inserer des donnees
     * incorrectes/nulles.
     */
    private int importDetections(Path dir) {
        int count = 0;
        for (Path file : listJsonFiles(dir)) {
            LocalDate fileDate = dateFromFileName(file);
            if (fileDate == null) {
                log.warn("Nom de fichier detection sans date valide, ignore : {}", file.getFileName());
                continue;
            }
            if (detectionEventRepository.countByEventDate(fileDate) > 0) {
                continue; // deja importe lors d'un demarrage precedent
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

    /** Les fichiers kilometrage/detection portent leur date dans le nom (AAAA-MM-JJ.json), seule source de date pour ces categories. */
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
