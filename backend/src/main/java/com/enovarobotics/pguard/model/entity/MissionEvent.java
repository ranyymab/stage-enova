package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité partagée pour les 4 catégories qui partagent le même format
 * d'événement start/end/pause observé dans les fichiers réels du robot :
 * Mission, Inspecting, Back_home, Docking.
 *
 * Note importante (écart avec le cahier des charges) :
 * Les fichiers réels montrent que "Inspecting" et "Back_home" suivent en
 * réalité le format "mission" (start/end/pause, Mission_name, Distance,
 * Start_point/Stop_point) et NON le format que le cahier des charges leur
 * attribuait initialement (Last_point/Delay pour inspection, BatteryLevel
 * pour back_home). C'est en fait la catégorie "Obstacle" qui contient les
 * données de progression (Last_point/Delay) — voir ObstacleEvent.
 */
@Entity
@Table(name = "mission_event", indexes = {
        @Index(name = "idx_mission_event_category_date", columnList = "category, eventDate"),
        @Index(name = "idx_mission_event_robot", columnList = "robotId"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** DOCKING, INSPECTING, BACK_HOME ou MISSION */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventCategory category;

    @Column(nullable = false, length = 10)
    private String robotId;

    /** "0-Info" : start | end | pause */
    @Column(nullable = false, length = 10)
    private String info;

    @Column(name = "mission_name", length = 255)
    private String missionName;

    /** Date d'origine telle que reçue (avant normalisation), conservée pour traçabilité */
    @Column(name = "raw_date", length = 20)
    private String rawDate;

    @Column(name = "raw_hour", length = 20)
    private String rawHour;

    /** Date + heure normalisées par le backend lors du parsing */
    @Column(name = "event_date")
    private java.time.LocalDate eventDate;

    @Column(name = "event_datetime")
    private LocalDateTime eventDatetime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Présent uniquement sur les enregistrements "start" */
    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "start_point", length = 20)
    private String startPoint;

    @Column(name = "stop_point", length = 20)
    private String stopPoint;

    @Column(name = "last_point", length = 20)
    private String lastPoint;

    /**
     * Niveau de batterie (%), pertinent pour la catégorie DOCKING
     * (cycles de charge). Absent du format "mission-like" de base du
     * cahier des charges, ajouté pour le suivi batterie du dashboard
     * (DashboardService : buildChargeCycles / resolveBatteryLevel).
     */
    @Column(name = "battery_level")
    private Integer batteryLevel;

    /**
     * État du cycle dock/undock pour les enregistrements DOCKING réels
     * ("1-State" du fichier source) : start | success | failed | "restart n=N".
     * Distinct de "info" ("0-Info" = docking | undocking pour ces
     * enregistrements), absent pour les autres catégories.
     */
    @Column(name = "docking_state", length = 30)
    private String dockingState;

    private Double latitude;

    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum EventCategory {
        MISSION, INSPECTING, BACK_HOME, DOCKING
    }
}
