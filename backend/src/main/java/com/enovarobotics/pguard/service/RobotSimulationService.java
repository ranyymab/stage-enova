package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.entity.DetectionEvent;
import com.enovarobotics.pguard.model.entity.KilometrageSummary;
import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import com.enovarobotics.pguard.repository.KilometrageSummaryRepository;
import com.enovarobotics.pguard.repository.MissionEventRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class RobotSimulationService {

    private final MissionEventRepository missionEventRepository;
    private final DetectionEventRepository detectionEventRepository;
    private final KilometrageSummaryRepository kilometrageSummaryRepository;

    @Value("${app.simulation.enabled:true}")
    private boolean enabled;

    @Value("${app.robot-id:ROBOT-001}")
    private String robotId;

    @Value("${app.simulation.km-per-tick:0.000407}")
    private double kmPerTick;

    @Value("${app.simulation.battery-drain-per-tick:0.0438}")
    private double batteryDrainPerTick;

    @Value("${app.simulation.battery-charge-per-tick:0.0789}")
    private double batteryChargePerTick;

    @Value("${app.simulation.battery-min:21}")
    private double batteryMin;

    @Value("${app.simulation.battery-max:92}")
    private double batteryMax;

    @Value("${app.simulation.anomaly-chance:0.006}")
    private double anomalyChancePerTick;

    @Value("${app.simulation.max-anomalies-per-day:5}")
    private int maxAnomaliesPerDay;

    private static final double[][] ROUTE = {
            {35.8176, 10.5913},
            {35.8176, 10.592962},
            {35.819397, 10.592962},
            {35.819397, 10.59407},
            {35.820744, 10.59407},
            {35.820744, 10.592408},
            {35.822092, 10.592408},
            {35.822092, 10.589638},
            {35.820295, 10.589638},
            {35.820295, 10.587977},
            {35.818498, 10.587977},
            {35.818498, 10.589638},
            {35.8176, 10.589638},
            {35.8176, 10.5913},
    };

    private static final String[] OBJECT_TYPES = {"person", "vehicle", "animal", "obstacle"};

    private enum Mode { PATROLLING, RETURNING, CHARGING }

    private Mode mode = Mode.CHARGING;
    private double routeProgressM = 0.0;
    private double batteryPercent = 85.0;
    private double todayDynamicMinutes = 0.0;
    private double todayStaticMinutes = 0.0;
    private int todayAnomalyCount = 0;
    private LocalDate simDay = LocalDate.now();
    private final Random random = new Random();

    private double[] segmentLengths;
    private double routeTotalLength;

    @PostConstruct
    void init() {
        segmentLengths = new double[ROUTE.length - 1];
        double total = 0;
        for (int i = 0; i < ROUTE.length - 1; i++) {
            double d = haversineMeters(ROUTE[i][0], ROUTE[i][1], ROUTE[i + 1][0], ROUTE[i + 1][1]);
            segmentLengths[i] = d;
            total += d;
        }
        routeTotalLength = total;
        log.info("Simulation robot initialisee : boucle de {} m, {} points", Math.round(routeTotalLength), ROUTE.length);
    }

    @Scheduled(fixedRate = 1000)
    public void tick() {
        if (!enabled) {
            return;
        }

        LocalDate today = LocalDate.now();
        if (!today.equals(simDay)) {
            simDay = today;
            todayDynamicMinutes = 0.0;
            todayStaticMinutes = 0.0;
            todayAnomalyCount = 0;
        }

        LocalDateTime now = LocalDateTime.now();
        double kmPerTickM = kmPerTick * 1000.0;

        switch (mode) {
            case PATROLLING -> {
                routeProgressM += kmPerTickM;
                double[] pos = positionAt(routeProgressM);
                batteryPercent = Math.max(batteryMin, batteryPercent - batteryDrainPerTick);
                todayDynamicMinutes += 1.0 / 60.0;
                updateKilometrage(kmPerTick, now);
                maybeLogAnomaly(pos, now);

                if (batteryPercent <= batteryMin) {
                    mode = Mode.RETURNING;
                    logMissionEvent(MissionEvent.EventCategory.MISSION, "end", "Ronde nocturne", pos, now, null, null);
                    logMissionEvent(MissionEvent.EventCategory.BACK_HOME, "start", "Retour a la base", pos, now, null, null);
                }
            }
            case RETURNING -> {
                routeProgressM = Math.max(0.0, routeProgressM - kmPerTickM);
                batteryPercent = Math.max(batteryMin, batteryPercent - (batteryDrainPerTick * 0.5));
                todayDynamicMinutes += 1.0 / 60.0;
                updateKilometrage(kmPerTick * 0.6, now);

                if (routeProgressM <= 0.0) {
                    double[] dock = ROUTE[0];
                    logMissionEvent(MissionEvent.EventCategory.BACK_HOME, "end", "Retour a la base", dock, now, null, null);
                    logMissionEvent(MissionEvent.EventCategory.DOCKING, "docking", "Station de charge", dock, now,
                            "success", (int) Math.round(batteryPercent));
                    mode = Mode.CHARGING;
                }
            }
            case CHARGING -> {
                batteryPercent = Math.min(batteryMax, batteryPercent + batteryChargePerTick);
                todayStaticMinutes += 1.0 / 60.0;
                updateKilometrage(0.0, now);

                if (batteryPercent >= batteryMax) {
                    double[] dock = ROUTE[0];
                    logMissionEvent(MissionEvent.EventCategory.DOCKING, "undocking", "Station de charge", dock, now,
                            "start", (int) Math.round(batteryPercent));
                    logMissionEvent(MissionEvent.EventCategory.MISSION, "start", "Ronde nocturne", dock, now, null, null);
                    mode = Mode.PATROLLING;
                    routeProgressM = 0.0;
                }
            }
        }
    }

    private double[] positionAt(double distanceAlongRouteM) {
        double d = ((distanceAlongRouteM % routeTotalLength) + routeTotalLength) % routeTotalLength;
        double acc = 0.0;
        for (int i = 0; i < segmentLengths.length; i++) {
            double segLen = segmentLengths[i];
            if (d <= acc + segLen || i == segmentLengths.length - 1) {
                double t = segLen == 0 ? 0 : (d - acc) / segLen;
                double lat = ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t;
                double lng = ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t;
                return new double[]{lat, lng};
            }
            acc += segLen;
        }
        return ROUTE[0];
    }

    private static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }

    private void updateKilometrage(double kmDelta, LocalDateTime now) {
        KilometrageSummary entity = kilometrageSummaryRepository
                .findByRobotIdAndSummaryDate(robotId, now.toLocalDate())
                .orElseGet(() -> KilometrageSummary.builder()
                        .robotId(robotId)
                        .summaryDate(now.toLocalDate())
                        .distanceKm(0.0)
                        .build());

        double newDistance = (entity.getDistanceKm() != null ? entity.getDistanceKm() : 0.0) + kmDelta;
        double totalMinutes = todayDynamicMinutes + todayStaticMinutes;

        entity.setDistanceKm(Math.round(newDistance * 1000.0) / 1000.0);
        entity.setDynamicMinutes(todayDynamicMinutes);
        entity.setStaticMinutes(todayStaticMinutes);
        entity.setTotalMinutes(totalMinutes);
        entity.setDynamicPercentage(totalMinutes > 0 ? (todayDynamicMinutes / totalMinutes) * 100.0 : 0.0);
        entity.setLastUpdate(now.toLocalTime().withNano(0).toString());

        kilometrageSummaryRepository.save(entity);
    }

    private void logMissionEvent(MissionEvent.EventCategory category, String info, String missionName,
                                  double[] pos, LocalDateTime now, String dockingState, Integer batteryLevel) {
        MissionEvent event = MissionEvent.builder()
                .category(category)
                .robotId(robotId)
                .info(info)
                .missionName(missionName)
                .rawDate(now.toLocalDate().toString())
                .rawHour(now.toLocalTime().withNano(0).toString())
                .eventDate(now.toLocalDate())
                .eventDatetime(now)
                .dockingState(dockingState)
                .batteryLevel(batteryLevel)
                .latitude(pos[0])
                .longitude(pos[1])
                .build();
        missionEventRepository.save(event);
    }

    private void maybeLogAnomaly(double[] pos, LocalDateTime now) {
        if (todayAnomalyCount >= maxAnomaliesPerDay) {
            return;
        }
        if (random.nextDouble() > anomalyChancePerTick) {
            return;
        }
        todayAnomalyCount++;
        String objectDetected = OBJECT_TYPES[random.nextInt(OBJECT_TYPES.length)];
        DetectionEvent event = DetectionEvent.builder()
                .robotId(robotId)
                .eventDate(now.toLocalDate())
                .rawHour(now.toLocalTime().withNano(0).toString())
                .eventDatetime(now)
                .objectDetected(objectDetected)
                .latitude(pos[0])
                .longitude(pos[1])
                .imageFileName(null)
                .imageFilePath(null)
                .criticite(classify(objectDetected))
                .statut(DetectionEvent.StatutAnomalie.NOUVELLE)
                .build();
        detectionEventRepository.save(event);
        log.info("Anomalie simulee : {} a ({}, {})", objectDetected, pos[0], pos[1]);
    }

    private DetectionEvent.Criticite classify(String objectDetected) {
        return switch (objectDetected) {
            case "person" -> DetectionEvent.Criticite.HAUTE;
            case "vehicle" -> DetectionEvent.Criticite.MOYENNE;
            case "animal" -> DetectionEvent.Criticite.FAIBLE;
            default -> DetectionEvent.Criticite.MOYENNE;
        };
    }
}
