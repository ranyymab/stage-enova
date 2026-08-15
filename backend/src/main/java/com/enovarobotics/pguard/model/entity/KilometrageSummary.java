package com.enovarobotics.pguard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "kilometrage_summary",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_kilometrage_robot_date",
                columnNames = {"robotId", "summaryDate"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KilometrageSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String robotId;

    @Column(name = "summary_date", nullable = false)
    private LocalDate summaryDate;

    @Column(name = "last_update", length = 20)
    private String lastUpdate;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "dynamic_percentage")
    private Double dynamicPercentage;

    @Column(name = "dynamic_minutes")
    private Double dynamicMinutes;

    @Column(name = "static_minutes")
    private Double staticMinutes;

    @Column(name = "total_minutes")
    private Double totalMinutes;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
