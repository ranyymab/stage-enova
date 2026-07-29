package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité pour la catégorie "Teleoperation" (sessions de pilotage manuel).
 * Format conforme au cahier des charges et aux fichiers réels :
 * start/stop, Mode (ex: "Xbox"), GPS (Latitude/Longitude pouvant être NaN
 * -> converti en NULL par le service de parsing).
 */
@Entity
@Table(name = "teleoperation_event", indexes = {
        @Index(name = "idx_teleop_date", columnList = "eventDate"),
        @Index(name = "idx_teleop_robot", columnList = "robotId"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeleoperationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String robotId;

    /** "0-Info" : start | stop */
    @Column(nullable = false, length = 10)
    private String info;

    @Column(name = "raw_date", length = 20)
    private String rawDate;

    @Column(name = "raw_hour", length = 20)
    private String rawHour;

    @Column(name = "event_date")
    private java.time.LocalDate eventDate;

    @Column(name = "event_datetime")
    private LocalDateTime eventDatetime;

    /** Mode de pilotage, ex: "Xbox" */
    @Column(length = 50)
    private String mode;

    private Double latitude;

    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
