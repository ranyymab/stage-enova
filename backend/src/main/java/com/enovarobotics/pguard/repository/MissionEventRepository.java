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

    List<MissionEvent> findByEventDateOrderByEventDatetimeAsc(LocalDate eventDate);

    Optional<MissionEvent> findFirstByEventDateLessThanEqualOrderByEventDateDescEventDatetimeDesc(LocalDate date);
}
