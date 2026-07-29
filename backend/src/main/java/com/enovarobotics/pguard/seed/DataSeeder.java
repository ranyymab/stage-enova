package com.enovarobotics.pguard.seed;

import com.enovarobotics.pguard.model.entity.*;
import com.enovarobotics.pguard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Générateur de données factices, basé sur la structure RÉELLE des fichiers
 * JSON du robot PGuard (analysée depuis un export réel), et non sur le
 * format provisoire du cahier des charges pour les catégories où les deux
 * diffèrent (Inspecting/Back_home/Docking sont au format "mission" ;
 * Obstacle contient les données de progression Last_point/Delay ; Detection
 * est plus simple, sans champ Criticite/Statut fournis par le robot).
 *
 * Contrainte respectée : les événements sont générés uniquement entre 20h
 * et 06h (fonctionnement nocturne du robot), sur les N derniers jours.
 *
 * Ne s'exécute que si la base est vide, pour ne pas dupliquer les données
 * à chaque redémarrage en développement.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final MissionEventRepository missionEventRepository;
    private final ObstacleProgressRepository obstacleProgressRepository;
    private final TeleoperationEventRepository teleoperationEventRepository;
    private final KilometrageSummaryRepository kilometrageSummaryRepository;
    private final DetectionEventRepository detectionEventRepository;

    @Value("${app.robot-id:ROBOT-001}")
    private String robotId;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.days:14}")
    private int seedDays;

    private final Random random = new Random();

    private static final String[] MISSION_NAMES = {
            "Mission_A.json", "Mission_3009.json", "MissionA3107.json", "test_RTK.json", "_rec.json"
    };
    private static final String[] OBJECTS_DETECTED = {
            "person", "vehicle", "animal", "unknown", "debris"
    };
    private static final double BASE_LAT = 35.8176;
    private static final double BASE_LNG = 10.5913;
    private static final double GPS_SPREAD_LAT = 0.0006;
    private static final double GPS_SPREAD_LNG = 0.0008;

    @EventListener(ApplicationReadyEvent.class)
    @Order(2)
    @Transactional
    public void seed() {
        if (!seedEnabled) {
            log.info("Seed désactivé (app.seed.enabled=false)");
            return;
        }
        if (missionEventRepository.count() > 0 || detectionEventRepository.count() > 0) {
            log.info("Données déjà présentes en base, génération ignorée");
            return;
        }

        log.info("Génération de {} jours de données factices pour {}...", seedDays, robotId);

        // IMPORTANT : on ne genere JAMAIS de donnees factices pour AUJOURD'HUI.
        // RobotSimulationService ecrit desormais reellement, seconde par seconde,
        // des points sequentiels et coherents pour la journee en cours. Si ce
        // seeder ajoutait EN PLUS des points aleatoires (jitterGps(), sans aucune
        // relation de voisinage) pour ce meme jour, la trajectoire du jour
        // melangerait des segments reels coherents et des points scatter
        // sans lien - exactement ce qui rendait le trajet affiche incoherent
        // ("ne ressemble a rien"). Les jours precedents restent generes
        // normalement, pour peupler l'historique/les graphiques.
        List<LocalDate> days = new ArrayList<>();
        for (int i = seedDays - 1; i >= 1; i--) {
            days.add(LocalDate.now().minusDays(i));
        }

        for (LocalDate day : days) {
            seedMissionLikeEvents(day, MissionEvent.EventCategory.MISSION, 2, true);
            seedMissionLikeEvents(day, MissionEvent.EventCategory.INSPECTING, 1, false);
            seedMissionLikeEvents(day, MissionEvent.EventCategory.BACK_HOME, 1, false);
            seedMissionLikeEvents(day, MissionEvent.EventCategory.DOCKING, 1, false);
            seedObstacleProgress(day);
            seedTeleoperation(day);
            seedKilometrage(day);
            seedDetections(day);
        }

        // NOTE: on ne génère plus de données pour "demain" (seedFutureLikeData) :
        // un robot ne peut pas avoir déjà enregistré de kilométrage pour un jour
        // qui n'est pas encore arrivé. C'est ce qui causait un point "futur" dans
        // le graphique de distance cumulée.

        log.info("Génération terminée : {} mission_event, {} obstacle_progress, {} teleoperation_event, " +
                        "{} kilometrage_summary, {} detection_event",
                missionEventRepository.count(),
                obstacleProgressRepository.count(),
                teleoperationEventRepository.count(),
                kilometrageSummaryRepository.count(),
                detectionEventRepository.count());
    }

    // ------------------------------------------------------------------
    // Mission / Inspecting / Back_home / Docking — format partagé start/end/pause
    // ------------------------------------------------------------------
    private void seedMissionLikeEvents(LocalDate day, MissionEvent.EventCategory category,
                                        int sessionsPerNight, boolean includeDistance) {
        for (int s = 0; s < sessionsPerNight; s++) {
            LocalDateTime start = randomNightTime(day);
            String missionName = MISSION_NAMES[random.nextInt(MISSION_NAMES.length)];
            double[] gpsStart = jitterGps();

            MissionEvent startEvent = MissionEvent.builder()
                    .category(category)
                    .robotId(robotId)
                    .info("start")
                    .missionName(missionName)
                    .rawDate(day.toString())
                    .rawHour(start.toLocalTime().toString())
                    .eventDate(day)
                    .eventDatetime(start)
                    .notes(randomStartNote())
                    .startPoint("0")
                    .distanceKm(includeDistance ? round(0.5 + random.nextDouble() * 4.5) : null)
                    .latitude(gpsStart[0])
                    .longitude(gpsStart[1])
                    .build();
            missionEventRepository.save(startEvent);

            LocalDateTime end = start.plusMinutes(5 + random.nextInt(90));
            double[] gpsEnd = jitterGps();

            MissionEvent endEvent = MissionEvent.builder()
                    .category(category)
                    .robotId(robotId)
                    .info("end")
                    .missionName(missionName)
                    .rawDate(day.toString())
                    .rawHour(end.toLocalTime().toString())
                    .eventDate(end.toLocalDate())
                    .eventDatetime(end)
                    .notes(randomEndNote())
                    .stopPoint(String.valueOf(random.nextInt(6)))
                    .latitude(gpsEnd[0])
                    .longitude(gpsEnd[1])
                    .build();
            missionEventRepository.save(endEvent);
        }
    }

    // ------------------------------------------------------------------
    // Obstacle — contient en réalité Last_point/Delay (progression d'inspection)
    // ------------------------------------------------------------------
    private void seedObstacleProgress(LocalDate day) {
        int points = 3 + random.nextInt(5);
        LocalDateTime current = randomNightTime(day);
        for (int p = 0; p < points; p++) {
            current = current.plusMinutes(1 + random.nextInt(4));
            double[] gps = jitterGps();
            ObstacleProgress progress = ObstacleProgress.builder()
                    .robotId(robotId)
                    .rawDate(day.toString())
                    .rawHour(current.toLocalTime().toString())
                    .eventDate(current.toLocalDate())
                    .eventDatetime(current)
                    .missionName(MISSION_NAMES[random.nextInt(MISSION_NAMES.length)])
                    .lastPoint(String.valueOf(p + 1))
                    .delaySeconds(round(random.nextDouble() * 60))
                    .latitude(gps[0])
                    .longitude(gps[1])
                    .build();
            obstacleProgressRepository.save(progress);
        }
    }

    // ------------------------------------------------------------------
    // Teleoperation — sessions de pilotage manuel
    // ------------------------------------------------------------------
    private void seedTeleoperation(LocalDate day) {
        int sessions = random.nextInt(3);
        for (int s = 0; s < sessions; s++) {
            LocalDateTime start = randomNightTime(day);
            double[] gpsStart = jitterGps();
            teleoperationEventRepository.save(TeleoperationEvent.builder()
                    .robotId(robotId)
                    .info("start")
                    .rawDate(day.toString())
                    .rawHour(start.toLocalTime().toString())
                    .eventDate(day)
                    .eventDatetime(start)
                    .mode("TELEOPERATION")
                    .latitude(random.nextInt(10) == 0 ? null : gpsStart[0])
                    .longitude(random.nextInt(10) == 0 ? null : gpsStart[1])
                    .build());

            LocalDateTime stop = start.plusMinutes(2 + random.nextInt(40));
            double[] gpsStop = jitterGps();
            teleoperationEventRepository.save(TeleoperationEvent.builder()
                    .robotId(robotId)
                    .info("stop")
                    .rawDate(stop.toLocalDate().toString())
                    .rawHour(stop.toLocalTime().toString())
                    .eventDate(stop.toLocalDate())
                    .eventDatetime(stop)
                    .mode("TELEOPERATION")
                    .latitude(gpsStop[0])
                    .longitude(gpsStop[1])
                    .build());
        }
    }

    // ------------------------------------------------------------------
    // Kilometrage — un seul résumé par jour (upsert dans le vrai service de parsing)
    // ------------------------------------------------------------------
    private void seedKilometrage(LocalDate day) {
        double distance = round(random.nextDouble() * 5);
        double dynamicMinutes = round(5 + random.nextDouble() * 40);
        double staticMinutes = round(60 + random.nextDouble() * 400);
        double total = round(dynamicMinutes + staticMinutes);
        double dynamicPct = total > 0 ? round(dynamicMinutes / total) : 0.0;

        kilometrageSummaryRepository.save(KilometrageSummary.builder()
                .robotId(robotId)
                .summaryDate(day)
                .lastUpdate(randomNightTime(day).toLocalTime().toString())
                .distanceKm(distance)
                .dynamicPercentage(dynamicPct)
                .dynamicMinutes(dynamicMinutes)
                .staticMinutes(staticMinutes)
                .totalMinutes(total)
                .build());
    }

    // ------------------------------------------------------------------
    // Detection — anomalies, structure réelle simple (hour, objectDetected, gps, image)
    // ------------------------------------------------------------------
    private void seedDetections(LocalDate day) {
        int detections = random.nextInt(3);
        for (int d = 0; d < detections; d++) {
            LocalDateTime when = randomNightTime(day);
            double[] gps = jitterGps();
            DetectionEvent.Criticite criticite = randomCriticite();
            String objectDetected = OBJECTS_DETECTED[random.nextInt(OBJECTS_DETECTED.length)];
            // Aucune photo réelle n'existe pour les détections synthétiques : on laisse
            // imageFileName/imageFilePath à null plutôt que d'inventer un nom de fichier
            // qui n'existe nulle part sur le disque (404 systématique côté frontend).
            detectionEventRepository.save(DetectionEvent.builder()
                    .robotId(robotId)
                    .eventDate(day)
                    .rawHour(when.toLocalTime().toString())
                    .eventDatetime(when)
                    .objectDetected(objectDetected)
                    .latitude(gps[0])
                    .longitude(gps[1])
                    .imageFileName(null)
                    .imageFilePath(null)
                    .criticite(criticite)
                    .statut(day.isEqual(LocalDate.now()) ? DetectionEvent.StatutAnomalie.NOUVELLE : randomStatut())
                    .build());
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Génère une heure aléatoire dans la plage de fonctionnement nocturne 20h-06h */
    private LocalDateTime randomNightTime(LocalDate day) {
        int hour;
        if (random.nextBoolean()) {
            hour = 20 + random.nextInt(4); // 20h-23h, soir du jour J
            return LocalDateTime.of(day, LocalTime.of(hour, random.nextInt(60), random.nextInt(60)));
        } else {
            hour = random.nextInt(6); // 00h-05h, matin du jour J+1
            return LocalDateTime.of(day.plusDays(1), LocalTime.of(hour, random.nextInt(60), random.nextInt(60)));
        }
    }

    private double[] jitterGps() {
        double lat = BASE_LAT + (random.nextDouble() - 0.5) * GPS_SPREAD_LAT;
        double lng = BASE_LNG + (random.nextDouble() - 0.5) * GPS_SPREAD_LNG;
        return new double[]{round6(lat), round6(lng)};
    }

    private String randomStartNote() {
        String[] notes = {"Start_pressed", "Between None and None", "Between 3 and 4; Goal: 1"};
        return notes[random.nextInt(notes.length)];
    }

    private String randomEndNote() {
        String[] notes = {"Automatic_end", "Home_reached", "Target_reached", "Emergency_pressed"};
        return notes[random.nextInt(notes.length)];
    }

    private DetectionEvent.Criticite randomCriticite() {
        double r = random.nextDouble();
        if (r < 0.5) return DetectionEvent.Criticite.FAIBLE;
        if (r < 0.8) return DetectionEvent.Criticite.MOYENNE;
        if (r < 0.95) return DetectionEvent.Criticite.HAUTE;
        return DetectionEvent.Criticite.CRITIQUE;
    }

    private DetectionEvent.StatutAnomalie randomStatut() {
        double r = random.nextDouble();
        if (r < 0.3) return DetectionEvent.StatutAnomalie.NOUVELLE;
        if (r < 0.7) return DetectionEvent.StatutAnomalie.EN_COURS;
        return DetectionEvent.StatutAnomalie.RESOLUE;
    }

    private double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private double round6(double v) {
        return Math.round(v * 1_000_000.0) / 1_000_000.0;
    }
}
