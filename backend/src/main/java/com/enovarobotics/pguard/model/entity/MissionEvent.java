package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventCategory category;

    @Column(nullable = false, length = 10)
    private String robotId;

    @Column(nullable = false, length = 10)
    private String info;

    @Column(name = "mission_name", length = 255)
    private String missionName;

    @Column(name = "raw_date", length = 20)
    private String rawDate;

    @Column(name = "raw_hour", length = 20)
    private String rawHour;

    @Column(name = "event_date")
    private java.time.LocalDate eventDate;

    @Column(name = "event_datetime")
    private LocalDateTime eventDatetime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "start_point", length = 20)
    private String startPoint;

    @Column(name = "stop_point", length = 20)
    private String stopPoint;

    @Column(name = "last_point", length = 20)
    private String lastPoint;

    @Column(name = "battery_level")
    private Integer batteryLevel;

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
