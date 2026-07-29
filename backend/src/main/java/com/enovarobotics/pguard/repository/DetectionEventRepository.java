package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.DetectionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DetectionEventRepository extends JpaRepository<DetectionEvent, Long> {

    List<DetectionEvent> findByStatutNotOrderByEventDatetimeDesc(DetectionEvent.StatutAnomalie statut);

    List<DetectionEvent> findTop20ByOrderByEventDatetimeDesc();

    long countByStatutNot(DetectionEvent.StatutAnomalie statut);

    long countByEventDate(LocalDate eventDate);

    long countByEventDateAndStatutNot(LocalDate eventDate, DetectionEvent.StatutAnomalie statut);

    List<DetectionEvent> findByEventDateOrderByEventDatetimeDesc(LocalDate eventDate);
}
