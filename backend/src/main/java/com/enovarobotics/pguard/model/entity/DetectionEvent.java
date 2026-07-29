package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entité pour la catégorie "Detection" (anomalies).
 *
 * Note importante (écart avec le cahier des charges) :
 * Le fichier réel disponible est beaucoup plus simple que le format
 * provisoire du cahier des charges : pas de champ "Criticite", pas de
 * préfixe numérique sur les clés. Structure réelle : hour, objectDetected,
 * gps {latitude, longitude}, image {fileName, filePath}.
 *
 * Les champs criticite/statut ajoutés ici sont déduits/attribués côté
 * backend (ex: valeur par défaut "NOUVELLE" + criticité par défaut ou
 * déterminée par une règle simple sur objectDetected), car ils ne sont
 * pas fournis par le robot dans les fichiers observés. Ceci correspond à
 * la fonctionnalité F4 (Gestion des anomalies) qui doit pouvoir classifier
 * et suivre les détections après réception.
 */
@Entity
@Table(name = "detection_event", indexes = {
        @Index(name = "idx_detection_date", columnList = "eventDate"),
        @Index(name = "idx_detection_robot", columnList = "robotId"),
        @Index(name = "idx_detection_statut", columnList = "statut"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetectionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String robotId;

    /** Date du fichier (AAAA-MM-JJ dans le nom de fichier, absente du contenu) */
    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "raw_hour", length = 20)
    private String rawHour;

    @Column(name = "event_datetime")
    private LocalDateTime eventDatetime;

    /** Champ réel du robot : "objectDetected" (ex: "person") */
    @Column(name = "object_detected", length = 100)
    private String objectDetected;

    private Double latitude;

    private Double longitude;

    @Column(name = "image_file_name")
    private String imageFileName;

    @Column(name = "image_file_path")
    private String imageFilePath;

    /** Attribué par le backend, absent des fichiers réels du robot */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private Criticite criticite = Criticite.MOYENNE;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private StatutAnomalie statut = StatutAnomalie.NOUVELLE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Criticite {
        FAIBLE, MOYENNE, HAUTE, CRITIQUE
    }

    public enum StatutAnomalie {
        NOUVELLE, EN_COURS, RESOLUE
    }
}
