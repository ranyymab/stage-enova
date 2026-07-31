package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.ObstacleProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ObstacleProgressRepository extends JpaRepository<ObstacleProgress, Long> {

    List<ObstacleProgress> findByEventDateOrderByEventDatetimeAsc(LocalDate eventDate);

    List<ObstacleProgress> findTop20ByOrderByEventDatetimeDesc();

    /** Tout l'historique jusqu'a une date donnee incluse (jamais le futur),
     *  sans la limite artificielle de findTop20. */
    List<ObstacleProgress> findByEventDateLessThanEqualOrderByEventDatetimeDesc(LocalDate maxDate);

    long countByEventDate(LocalDate eventDate);
}
