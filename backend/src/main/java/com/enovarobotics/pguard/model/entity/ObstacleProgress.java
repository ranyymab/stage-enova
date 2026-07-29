package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité pour la catégorie "Obstacle".
 *
 * Note importante (écart avec le cahier des charges) :
 * Dans les fichiers réels, "Obstacle" contient en fait la progression le
 * long des points de passage (Last_point, Delay en secondes) — c'est-à-dire
 * exactement ce que le cahier des charges décrivait comme le contenu de la
 * catégorie "inspection". Le nom de catégorie réel ("Obstacle") est conservé
 * tel quel pour rester fidèle aux fichiers du robot ; le mapping vers la
 * fonctionnalité "Suivi d'inspection" du dashboard (F3) se fait au niveau
 * du service / contrôleur, pas du nom de la table.
 */
@Entity
@Table(name = "obstacle_progress", indexes = {
        @Index(name = "idx_obstacle_date", columnList = "eventDate"),
        @Index(name = "idx_obstacle_robot", columnList = "robotId"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObstacleProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String robotId;

    @Column(name = "raw_date", length = 20)
    private String rawDate;

    @Column(name = "raw_hour", length = 20)
    private String rawHour;

    @Column(name = "event_date")
    private java.time.LocalDate eventDate;

    @Column(name = "event_datetime")
    private LocalDateTime eventDatetime;

    @Column(name = "mission_name", length = 255)
    private String missionName;

    @Column(name = "last_point", length = 20)
    private String lastPoint;

    /** Retard en secondes par rapport au point précédent */
    @Column(name = "delay_seconds")
    private Double delaySeconds;

    private Double latitude;

    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
