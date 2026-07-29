package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.MissionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MissionEventRepository extends JpaRepository<MissionEvent, Long> {

    List<MissionEvent> findByCategoryOrderByEventDatetimeDesc(MissionEvent.EventCategory category);

    List<MissionEvent> findByCategoryAndEventDateOrderByEventDatetimeAsc(
            MissionEvent.EventCategory category, LocalDate eventDate);

    List<MissionEvent> findByCategoryAndRobotIdOrderByEventDatetimeDesc(
            MissionEvent.EventCategory category, String robotId);

    long countByCategoryAndEventDate(MissionEvent.EventCategory category, LocalDate eventDate);

    /** Toutes catégories confondues pour une date donnée (utilisé par DashboardService
     * pour construire la trajectoire et la timeline tous événements). */
    List<MissionEvent> findByEventDateOrderByEventDatetimeAsc(LocalDate eventDate);

    /** Le jour le plus recent, a la date donnee ou avant, qui contient au moins
     * un evenement — utilise pour retomber sur "le dernier etat connu" quand la
     * date demandee n'a aucune activite (voir DashboardService.resolveEffectiveDataDate). */
    Optional<MissionEvent> findFirstByEventDateLessThanEqualOrderByEventDateDescEventDatetimeDesc(LocalDate date);
}
