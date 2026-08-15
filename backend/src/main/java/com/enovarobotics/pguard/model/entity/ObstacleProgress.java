package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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
