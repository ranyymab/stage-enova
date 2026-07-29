package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.TeleoperationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TeleoperationEventRepository extends JpaRepository<TeleoperationEvent, Long> {

    List<TeleoperationEvent> findByEventDateOrderByEventDatetimeAsc(LocalDate eventDate);

    long countByEventDate(LocalDate eventDate);
}
