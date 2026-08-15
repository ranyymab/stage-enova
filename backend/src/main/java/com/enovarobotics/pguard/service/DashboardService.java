package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.entity.*;
import com.enovarobotics.pguard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MissionEventRepository missionEventRepository;
    private final ObstacleProgressRepository obstacleProgressRepository;
    private final TeleoperationEventRepository teleoperationEventRepository;
    private final KilometrageSummaryRepository kilometrageSummaryRepository;
    private final DetectionEventRepository detectionEventRepository;

    @Value("${app.robot-id:ROBOT-001}")
    private String robotId;

    public LocalDate resolveReferenceDate(LocalDate requested) {
        return requested != null ? requested : LocalDate.now();
    }

    private LocalDate resolveEffectiveDataDate(LocalDate referenceDate) {
        boolean hasActivity = !missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).isEmpty();
        if (hasActivity) {
            return referenceDate;
        }
        return missionEventRepository
                .findFirstByEventDateLessThanEqualOrderByEventDateDescEventDatetimeDesc(referenceDate)
                .map(MissionEvent::getEventDate)
                .orElse(referenceDate);
    }

    public Map<String, Object> buildKpi(LocalDate referenceDate) {
        Map<String, Object> kpi = new HashMap<>();

        LocalDate effectiveDate = resolveEffectiveDataDate(referenceDate);
        boolean hasDataForDate = effectiveDate.equals(referenceDate);

        Optional<KilometrageSummary> dayKm = kilometrageSummaryRepository
                .findByRobotIdAndSummaryDate(robotId, effectiveDate);
        if (dayKm.isEmpty()) {
            dayKm = kilometrageSummaryRepository.findFirstByRobotIdOrderBySummaryDateDesc(robotId);
        }
        kpi.put("distanceJourKm", dayKm.map(KilometrageSummary::getDistanceKm).orElse(0.0));
        kpi.put("hasDataForDate", hasDataForDate);
        kpi.put("derniereDateAvecDonnees", hasDataForDate ? null : effectiveDate.toString());

        long anomaliesOuvertes = detectionEventRepository
                .countByEventDateAndStatutNot(effectiveDate, DetectionEvent.StatutAnomalie.RESOLUE);
        kpi.put("anomaliesOuvertes", anomaliesOuvertes);

        List<MissionEvent> dayMissions = missionEventRepository
                .findByEventDateOrderByEventDatetimeAsc(effectiveDate);

        List<TeleoperationEvent> teleops = teleoperationEventRepository
                .findByEventDateOrderByEventDatetimeAsc(effectiveDate);
        long sessionsTeleoperation = teleops.stream()
                .filter(t -> "start".equalsIgnoreCase(t.getInfo()))
                .count();
        kpi.put("sessionsTeleoperation", sessionsTeleoperation);

        long rondesRealisees = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.MISSION)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .count();
        kpi.put("rondesRealisees", rondesRealisees);

        long retoursBase = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.BACK_HOME)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .count();
        kpi.put("retoursBase", retoursBase);

        boolean teleportationEnCours = false;
        if (!teleops.isEmpty()) {
            TeleoperationEvent last = teleops.get(teleops.size() - 1);
            teleportationEnCours = "start".equalsIgnoreCase(last.getInfo());
        }
        kpi.put("teleportationEnCours", teleportationEnCours);

        String statutMission = "EN_REPOS";
        String missionEnCours = null;
        String modeRobot = "AUTONOME";

        if (teleportationEnCours) {
            statutMission = "EN_TELEPORTATION";
            missionEnCours = null;
            modeRobot = "TELEPORTATION";
        }

        Optional<MissionEvent> latestMissionStart = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.MISSION)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .max(Comparator.comparing(MissionEvent::getEventDatetime, Comparator.nullsLast(Comparator.naturalOrder())));

        if (latestMissionStart.isPresent()) {
            MissionEvent start = latestMissionStart.get();
            boolean hasEndAfter = dayMissions.stream()
                    .filter(m -> m.getCategory() == MissionEvent.EventCategory.MISSION)
                    .filter(m -> "end".equalsIgnoreCase(m.getInfo()))
                    .filter(m -> Objects.equals(m.getMissionName(), start.getMissionName()))
                    .anyMatch(m -> m.getEventDatetime() != null
                            && start.getEventDatetime() != null
                            && !m.getEventDatetime().isBefore(start.getEventDatetime()));

            if (!hasEndAfter) {

                missionEnCours = start.getMissionName();
                if (!teleportationEnCours) {
                    statutMission = "EN_MISSION";
                    modeRobot = "AUTONOME";
                }
            }
        }

        Optional<MissionEvent> latestBackHomeStart = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.BACK_HOME)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .max(Comparator.comparing(MissionEvent::getEventDatetime, Comparator.nullsLast(Comparator.naturalOrder())));

        boolean retourBaseEnCours = false;
        if (latestBackHomeStart.isPresent()) {
            MissionEvent bhStart = latestBackHomeStart.get();
            boolean bhHasEndAfter = dayMissions.stream()
                    .filter(m -> m.getCategory() == MissionEvent.EventCategory.BACK_HOME)
                    .filter(m -> "end".equalsIgnoreCase(m.getInfo()))
                    .anyMatch(m -> m.getEventDatetime() != null
                            && bhStart.getEventDatetime() != null
                            && !m.getEventDatetime().isBefore(bhStart.getEventDatetime()));
            retourBaseEnCours = !bhHasEndAfter;
        }
        kpi.put("retourBaseEnCours", retourBaseEnCours);

        if (retourBaseEnCours && !teleportationEnCours) {
            statutMission = "RETOUR_BASE";
            modeRobot = "RETOUR_BASE";
        }

        boolean urgenceObstacle = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.INSPECTING)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .count() >= 2;
        if (urgenceObstacle && !teleportationEnCours) {
            statutMission = "EN_TELEPORTATION";
            missionEnCours = null;
            modeRobot = "TELEPORTATION_URGENCE";
        }

        kpi.put("statutMission", statutMission);
        kpi.put("modeRobot", modeRobot);
        kpi.put("missionEnCours", missionEnCours);
        kpi.put("dateReference", effectiveDate.toString());
        kpi.put("derniereMiseAJour", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

        Map<String, Object> robotLive = buildRobotLive(effectiveDate);
        kpi.put("batteryPercent", robotLive.get("batteryPercent"));
        kpi.put("chargingStatus", robotLive.get("chargingStatus"));

        return kpi;
    }

    public Map<String, Object> buildRobotLive(LocalDate referenceDate) {

        LocalDate effectiveDate = resolveEffectiveDataDate(referenceDate);

        Map<String, Object> live = new HashMap<>();
        live.put("dateReference", effectiveDate.toString());

        List<Map<String, Object>> trajectory = buildTrajectory(effectiveDate);
        live.put("trajectory", trajectory);

        String modeRobot = buildModeRobot(effectiveDate);
        live.put("modeRobot", modeRobot);

        List<Map<String, Object>> chargeCycles = buildChargeCycles(effectiveDate);
        live.put("chargeCycles", chargeCycles);

        Map<String, Object> position = findCurrentPosition(effectiveDate, trajectory);
        live.put("position", position);

        Integer battery = resolveBatteryLevel(effectiveDate, chargeCycles, position);

        live.put("batteryPercent", battery != null ? battery : 21);

        String chargingStatus = resolveChargingStatus(effectiveDate, chargeCycles);
        live.put("chargingStatus", chargingStatus);

        return live;
    }

    public List<Map<String, Object>> buildTrajectory(LocalDate referenceDate) {
        List<TrajectoryPoint> points = new ArrayList<>();

        missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).forEach(m -> {
            if (hasValidGps(m.getLatitude(), m.getLongitude())) {
                points.add(new TrajectoryPoint(
                        m.getEventDatetime(),
                        m.getLatitude(),
                        m.getLongitude(),
                        m.getRawHour(),
                        categoryLabel(m.getCategory()),
                        m.getInfo(),
                        m.getMissionName()
                ));
            }
        });

        teleoperationEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).forEach(t -> {
            if (hasValidGps(t.getLatitude(), t.getLongitude())) {
                points.add(new TrajectoryPoint(
                        t.getEventDatetime(),
                        t.getLatitude(),
                        t.getLongitude(),
                        t.getRawHour(),
                        "Téléopération",
                        t.getInfo(),
                        t.getMode()
                ));
            }
        });

        obstacleProgressRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).forEach(o -> {
            if (hasValidGps(o.getLatitude(), o.getLongitude())) {
                points.add(new TrajectoryPoint(
                        o.getEventDatetime(),
                        o.getLatitude(),
                        o.getLongitude(),
                        o.getRawHour(),
                        "Obstacle",
                        "progress",
                        o.getMissionName()
                ));
            }
        });

        detectionEventRepository.findAll().stream()
                .filter(d -> referenceDate.equals(d.getEventDate()))
                .filter(d -> hasValidGps(d.getLatitude(), d.getLongitude()))
                .forEach(d -> points.add(new TrajectoryPoint(
                        d.getEventDatetime(),
                        d.getLatitude(),
                        d.getLongitude(),
                        d.getRawHour(),
                        "Détection",
                        d.getObjectDetected(),
                        null
                )));

        points.sort(Comparator.comparing(TrajectoryPoint::datetime, Comparator.nullsLast(Comparator.naturalOrder())));
        List<TrajectoryPoint> simplifiedPoints = simplifyTrajectory(points);

        return simplifiedPoints.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("latitude", p.latitude());
            map.put("longitude", p.longitude());
            map.put("heure", p.heure());
            map.put("source", p.source());
            map.put("label", p.label());
            map.put("detail", p.detail());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> buildChargeCycles(LocalDate referenceDate) {
        List<MissionEvent> dockingEvents = missionEventRepository
                .findByCategoryAndEventDateOrderByEventDatetimeAsc(MissionEvent.EventCategory.DOCKING, referenceDate);

        List<Map<String, Object>> cycles = new ArrayList<>();
        MissionEvent pendingDockSuccess = null;

        for (MissionEvent event : dockingEvents) {
            String info = event.getInfo() != null ? event.getInfo().toLowerCase() : "";
            String state = event.getDockingState() != null ? event.getDockingState().toLowerCase() : "";

            if ("docking".equals(info) && "success".equals(state)) {
                pendingDockSuccess = event;
                continue;
            }

            if ("undocking".equals(info) && "start".equals(state) && pendingDockSuccess != null) {
                Map<String, Object> cycle = new HashMap<>();
                cycle.put("dockHeure", pendingDockSuccess.getRawHour());
                cycle.put("undockHeure", event.getRawHour());
                cycle.put("batteryBefore", pendingDockSuccess.getBatteryLevel());
                cycle.put("batteryAfter", event.getBatteryLevel());

                int before = pendingDockSuccess.getBatteryLevel() != null ? pendingDockSuccess.getBatteryLevel() : 0;
                int after = event.getBatteryLevel() != null ? event.getBatteryLevel() : before;
                cycle.put("batteryGained", after - before);

                if (pendingDockSuccess.getEventDatetime() != null && event.getEventDatetime() != null) {
                    long minutes = ChronoUnit.MINUTES.between(pendingDockSuccess.getEventDatetime(), event.getEventDatetime());
                    cycle.put("durationMinutes", minutes);
                } else {
                    cycle.put("durationMinutes", 0);
                }

                cycle.put("stationLatitude", pendingDockSuccess.getLatitude());
                cycle.put("stationLongitude", pendingDockSuccess.getLongitude());
                cycle.put("status", "TERMINE");
                cycles.add(cycle);
                pendingDockSuccess = null;
            }
        }

        if (pendingDockSuccess != null) {
            Map<String, Object> cycle = new HashMap<>();
            cycle.put("dockHeure", pendingDockSuccess.getRawHour());
            cycle.put("undockHeure", null);
            cycle.put("batteryBefore", pendingDockSuccess.getBatteryLevel());
            cycle.put("batteryAfter", null);
            cycle.put("batteryGained", null);
            cycle.put("durationMinutes", null);
            cycle.put("stationLatitude", pendingDockSuccess.getLatitude());
            cycle.put("stationLongitude", pendingDockSuccess.getLongitude());
            cycle.put("status", "EN_COURS");
            cycles.add(cycle);
        }

        return cycles;
    }

    private Map<String, Object> findCurrentPosition(LocalDate referenceDate, List<Map<String, Object>> trajectory) {
        if (!trajectory.isEmpty()) {
            Map<String, Object> last = trajectory.get(trajectory.size() - 1);
            Map<String, Object> pos = new HashMap<>(last);
            pos.put("date", referenceDate.toString());
            return pos;
        }

        return missionEventRepository.findAll().stream()
                .filter(m -> hasValidGps(m.getLatitude(), m.getLongitude()))
                .max(Comparator.comparing(MissionEvent::getEventDatetime, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(m -> {
                    Map<String, Object> pos = new HashMap<>();
                    pos.put("latitude", m.getLatitude());
                    pos.put("longitude", m.getLongitude());
                    pos.put("heure", m.getRawHour());
                    pos.put("source", categoryLabel(m.getCategory()));
                    pos.put("label", m.getInfo());
                    pos.put("detail", m.getMissionName());
                    pos.put("date", m.getEventDate() != null ? m.getEventDate().toString() : "");
                    return pos;
                })
                .orElseGet(HashMap::new);
    }

    private Integer resolveBatteryLevel(LocalDate referenceDate, List<Map<String, Object>> chargeCycles,
                                        Map<String, Object> position) {
        Optional<MissionEvent> latestWithBattery = missionEventRepository
                .findByCategoryAndEventDateOrderByEventDatetimeAsc(MissionEvent.EventCategory.DOCKING, referenceDate)
                .stream()
                .filter(m -> m.getBatteryLevel() != null)
                .max(Comparator.comparing(MissionEvent::getEventDatetime, Comparator.nullsLast(Comparator.naturalOrder())));

        if (latestWithBattery.isPresent()) {
            return latestWithBattery.get().getBatteryLevel();
        }

        if (!chargeCycles.isEmpty()) {
            Map<String, Object> lastCycle = chargeCycles.get(chargeCycles.size() - 1);
            Object after = lastCycle.get("batteryAfter");
            if (after != null) return (Integer) after;
            Object before = lastCycle.get("batteryBefore");
            if (before != null) return (Integer) before;
        }

        return null;
    }

    private String resolveChargingStatus(LocalDate referenceDate, List<Map<String, Object>> chargeCycles) {

        List<TeleoperationEvent> teleops = teleoperationEventRepository
                .findByEventDateOrderByEventDatetimeAsc(referenceDate);
        if (!teleops.isEmpty()) {
            TeleoperationEvent lastTeleop = teleops.get(teleops.size() - 1);
            if ("start".equalsIgnoreCase(lastTeleop.getInfo())) {
                return "EN_TELEPORTATION";
            }
        }

        List<MissionEvent> missionEvents = missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate);
        boolean urgenceObstacle = missionEvents.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.INSPECTING)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .count() >= 2;
        if (urgenceObstacle) {
            return "EN_TELEPORTATION";
        }

        if (!chargeCycles.isEmpty()) {
            Map<String, Object> lastCycle = chargeCycles.get(chargeCycles.size() - 1);
            if ("EN_COURS".equals(lastCycle.get("status"))) {
                return "EN_CHARGE";
            }
        }

        List<MissionEvent> dockingEvents = missionEventRepository
                .findByCategoryAndEventDateOrderByEventDatetimeAsc(MissionEvent.EventCategory.DOCKING, referenceDate);

        if (!dockingEvents.isEmpty()) {
            MissionEvent last = dockingEvents.get(dockingEvents.size() - 1);
            String info = last.getInfo() != null ? last.getInfo().toLowerCase() : "";
            String state = last.getDockingState() != null ? last.getDockingState().toLowerCase() : "";

            if ("undocking".equals(info)) {
                return "EN_DEPLACEMENT";
            }
            if ("docking".equals(info) && "success".equals(state)) {
                return "EN_CHARGE";
            }
        }

        boolean missionActive = missionEvents.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.MISSION)
                .anyMatch(m -> "start".equalsIgnoreCase(m.getInfo()));
        if (missionActive) {
            return "EN_DEPLACEMENT";
        }

        return "A_LA_STATION";
    }

    private String buildModeRobot(LocalDate referenceDate) {
        List<TeleoperationEvent> teleops = teleoperationEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate);
        if (!teleops.isEmpty()) {
            TeleoperationEvent last = teleops.get(teleops.size() - 1);
            if ("start".equalsIgnoreCase(last.getInfo())) {
                return "TELEPORTATION";
            }
        }

        List<MissionEvent> dayMissions = missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate);

        long urgentInspectionStarts = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.INSPECTING)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .count();
        if (urgentInspectionStarts >= 2) {
            return "TELEPORTATION_URGENCE";
        }

        Optional<MissionEvent> latestBackHomeStart = dayMissions.stream()
                .filter(m -> m.getCategory() == MissionEvent.EventCategory.BACK_HOME)
                .filter(m -> "start".equalsIgnoreCase(m.getInfo()))
                .max(Comparator.comparing(MissionEvent::getEventDatetime, Comparator.nullsLast(Comparator.naturalOrder())));
        if (latestBackHomeStart.isPresent()) {
            MissionEvent bhStart = latestBackHomeStart.get();
            boolean bhHasEndAfter = dayMissions.stream()
                    .filter(m -> m.getCategory() == MissionEvent.EventCategory.BACK_HOME)
                    .filter(m -> "end".equalsIgnoreCase(m.getInfo()))
                    .anyMatch(m -> m.getEventDatetime() != null
                            && bhStart.getEventDatetime() != null
                            && !m.getEventDatetime().isBefore(bhStart.getEventDatetime()));
            if (!bhHasEndAfter) {
                return "RETOUR_BASE";
            }
        }

        return "AUTONOME";
    }

    private List<TrajectoryPoint> simplifyTrajectory(List<TrajectoryPoint> points) {
        List<TrajectoryPoint> simplified = new ArrayList<>();
        for (TrajectoryPoint point : points) {
            if (simplified.isEmpty()) {
                simplified.add(point);
                continue;
            }
            TrajectoryPoint previous = simplified.get(simplified.size() - 1);
            boolean sameLocation = Math.abs(point.latitude() - previous.latitude()) < 1e-6
                    && Math.abs(point.longitude() - previous.longitude()) < 1e-6;
            boolean sameContext = Objects.equals(point.heure(), previous.heure())
                    && Objects.equals(point.source(), previous.source())
                    && Objects.equals(point.label(), previous.label());
            if (!sameLocation || !sameContext) {
                simplified.add(point);
            }
        }
        return simplified;
    }

    private boolean hasValidGps(Double lat, Double lng) {
        return lat != null && lng != null && !lat.isNaN() && !lng.isNaN();
    }

    private record TrajectoryPoint(
            LocalDateTime datetime,
            double latitude,
            double longitude,
            String heure,
            String source,
            String label,
            String detail
    ) {}

    public List<Map<String, Object>> buildDistanceParJour() {
        LocalDate today = LocalDate.now();

        List<KilometrageSummary> summaries = kilometrageSummaryRepository
                .findByRobotIdOrderBySummaryDateAsc(robotId)
                .stream()

                .filter(km -> !km.getSummaryDate().isAfter(today))
                .collect(Collectors.toList());

        double cumulative = 0.0;
        List<Map<String, Object>> points = new ArrayList<>();
        for (KilometrageSummary km : summaries) {
            double distance = km.getDistanceKm() != null ? km.getDistanceKm() : 0.0;
            cumulative += distance;

            Map<String, Object> point = new HashMap<>();
            point.put("date", km.getSummaryDate().toString());
            point.put("distanceKm", distance);
            point.put("cumulativeKm", Math.round(cumulative * 100.0) / 100.0);
            points.add(point);
        }

        return points;
    }

    public Map<String, Object> buildRepartitionTemps(LocalDate referenceDate) {
        Map<String, Object> repartition = new HashMap<>();

        Optional<KilometrageSummary> summary = kilometrageSummaryRepository
                .findByRobotIdAndSummaryDate(robotId, referenceDate);
        if (summary.isEmpty()) {
            summary = kilometrageSummaryRepository.findFirstByRobotIdOrderBySummaryDateDesc(robotId);
        }

        if (summary.isPresent()) {
            KilometrageSummary km = summary.get();
            repartition.put("dynamiqueMinutes", km.getDynamicMinutes());
            repartition.put("statiqueMinutes", km.getStaticMinutes());
            repartition.put("totalMinutes", km.getTotalMinutes());
            repartition.put("dateReference", km.getSummaryDate().toString());
        } else {
            repartition.put("dynamiqueMinutes", 0.0);
            repartition.put("statiqueMinutes", 0.0);
            repartition.put("totalMinutes", 0.0);
            repartition.put("dateReference", referenceDate.toString());
        }

        return repartition;
    }

    public List<Map<String, Object>> buildTimeline(LocalDate referenceDate) {
        return missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).stream()
                .map(this::toTimelineEntry)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> buildActivityFeed(LocalDate referenceDate) {
        List<Map<String, Object>> feed = new ArrayList<>();

        for (MissionEvent m : missionEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate)) {
            Map<String, Object> entry = new LinkedHashMap<>();
            String category = m.getCategory() != null ? m.getCategory().name() : "MISSION";
            entry.put("id", "mission-" + m.getId());
            entry.put("kind", category);
            entry.put("heure", m.getRawHour());
            entry.put("datetime", m.getEventDatetime() != null ? m.getEventDatetime().toString() : null);
            entry.put("title", activityTitle(category, m.getInfo(), m.getDockingState()));
            entry.put("subtitle", activitySubtitle(m));
            entry.put("tone", activityTone(category, m.getInfo(), m.getDockingState()));
            entry.put("batteryLevel", m.getBatteryLevel());
            feed.add(entry);
        }

        for (TeleoperationEvent t : teleoperationEventRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate)) {
            Map<String, Object> entry = new LinkedHashMap<>();
            boolean isStart = "start".equalsIgnoreCase(t.getInfo());
            entry.put("id", "teleop-" + t.getId());
            entry.put("kind", "TELEOPERATION");
            entry.put("heure", t.getRawHour());
            entry.put("datetime", t.getEventDatetime() != null ? t.getEventDatetime().toString() : null);
            entry.put("title", isStart ? "Teleoperation - prise de controle" : "Teleoperation - fin de session");
            entry.put("subtitle", t.getMode() != null ? "Mode : " + t.getMode() : null);
            entry.put("tone", isStart ? "warning" : "neutral");
            feed.add(entry);
        }

        for (DetectionEvent d : detectionEventRepository.findByEventDateOrderByEventDatetimeDesc(referenceDate)) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", "detection-" + d.getId());
            entry.put("kind", "DETECTION");
            entry.put("heure", d.getRawHour());
            entry.put("datetime", d.getEventDatetime() != null ? d.getEventDatetime().toString() : null);
            entry.put("title", "Anomalie detectee : " + (d.getObjectDetected() != null ? d.getObjectDetected() : "inconnu"));
            entry.put("subtitle", d.getCriticite() != null ? "Criticite : " + d.getCriticite() : null);
            entry.put("tone", d.getCriticite() == DetectionEvent.Criticite.HAUTE
                    || d.getCriticite() == DetectionEvent.Criticite.CRITIQUE ? "critical" : "warning");
            entry.put("objectDetected", d.getObjectDetected());
            feed.add(entry);
        }

        feed.sort((a, b) -> {
            String da = (String) a.get("datetime");
            String db = (String) b.get("datetime");
            if (da == null || db == null) return 0;
            return db.compareTo(da);
        });

        return feed;
    }

    private String activityTitle(String category, String info, String dockingState) {
        return switch (category) {
            case "MISSION" -> "start".equalsIgnoreCase(info) ? "Ronde - debut" : "Ronde - fin";
            case "INSPECTING" -> "start".equalsIgnoreCase(info) ? "Inspection - debut" : "Inspection - fin";
            case "BACK_HOME" -> "start".equalsIgnoreCase(info) ? "Retour a la base - depart" : "Retour a la base - arrivee";
            case "DOCKING" -> {
                if ("docking".equalsIgnoreCase(info)) {
                    yield "success".equalsIgnoreCase(dockingState) ? "Arrivee au poste de charge" : "Tentative de docking";
                }
                yield "Depart du poste de charge";
            }
            default -> category + " - " + info;
        };
    }

    private String activitySubtitle(MissionEvent m) {
        if (m.getMissionName() != null && !m.getMissionName().isBlank()) {
            return m.getMissionName();
        }
        if (m.getDistanceKm() != null) {
            return String.format("%.2f km parcourus", m.getDistanceKm());
        }
        return null;
    }

    private String activityTone(String category, String info, String dockingState) {
        if ("DOCKING".equals(category)) {
            if ("docking".equalsIgnoreCase(info) && !"success".equalsIgnoreCase(dockingState)) {
                return "critical";
            }
            return "good";
        }
        if ("BACK_HOME".equals(category)) {
            return "warning";
        }
        return "neutral";
    }

    public List<Map<String, Object>> buildInspectionPoints(LocalDate referenceDate) {
        return obstacleProgressRepository.findByEventDateOrderByEventDatetimeAsc(referenceDate).stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    int lastPt = 0;
                    try {
                        lastPt = Integer.parseInt(p.getLastPoint());
                    } catch (Exception ignored) {
                    }
                    map.put("lastPoint", lastPt);
                    map.put("delaySeconds", p.getDelaySeconds() != null ? p.getDelaySeconds() : 0.0);
                    map.put("heure", p.getRawHour());
                    map.put("missionName", p.getMissionName());
                    map.put("date", p.getEventDate() != null ? p.getEventDate().toString() : "");
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> buildAnomaliesRecentes(LocalDate referenceDate) {
        LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now();
        List<DetectionEvent> anomalies = detectionEventRepository.findByEventDateOrderByEventDatetimeDesc(effectiveDate);

        return anomalies.stream()
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("type", d.getObjectDetected() != null ? d.getObjectDetected().toUpperCase() : "UNKNOWN");
                    map.put("date", d.getEventDate() != null ? d.getEventDate().toString() : "");
                    map.put("heure", d.getRawHour());
                    map.put("criticite", d.getCriticite().toString());
                    map.put("statut", d.getStatut().toString());
                    map.put("latitude", d.getLatitude());
                    map.put("longitude", d.getLongitude());
                    map.put("imageUrl", buildImageUrl(d));
                    map.put("robotId", d.getRobotId());
                    return map;
                })
                .collect(Collectors.toList());
    }

    private String buildImageUrl(DetectionEvent detection) {
        if (detection == null) {
            return null;
        }
        if (detection.getImageFilePath() != null && !detection.getImageFilePath().isBlank()) {
            return detection.getImageFilePath();
        }
        if (detection.getImageFileName() != null && !detection.getImageFileName().isBlank()) {
            return "/images/detections/" + detection.getImageFileName();
        }
        return null;
    }

    private Map<String, Object> toTimelineEntry(MissionEvent m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("category", m.getCategory() != null ? m.getCategory().name() : null);
        map.put("categoryLabel", m.getCategory() != null ? categoryLabel(m.getCategory()) : null);
        map.put("missionName", m.getMissionName());
        map.put("type", m.getInfo());
        map.put("date", m.getEventDate() != null ? m.getEventDate().toString() : m.getRawDate());
        map.put("heure", m.getRawHour());
        map.put("notes", m.getNotes());
        map.put("latitude", m.getLatitude());
        map.put("longitude", m.getLongitude());
        map.put("distanceKm", m.getDistanceKm());
        map.put("startPoint", m.getStartPoint());
        map.put("stopPoint", m.getStopPoint());
        map.put("lastPoint", m.getLastPoint());
        map.put("batteryLevel", m.getBatteryLevel());
        return map;
    }

    private String categoryLabel(MissionEvent.EventCategory category) {
        return switch (category) {
            case MISSION -> "Mission";
            case DOCKING -> "Docking";
            case INSPECTING -> "Inspection";
            case BACK_HOME -> "Retour base";
        };
    }
}
