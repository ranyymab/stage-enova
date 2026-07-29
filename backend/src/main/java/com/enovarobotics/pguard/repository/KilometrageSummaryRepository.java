package com.enovarobotics.pguard.repository;

import com.enovarobotics.pguard.model.entity.KilometrageSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface KilometrageSummaryRepository extends JpaRepository<KilometrageSummary, Long> {

    Optional<KilometrageSummary> findByRobotIdAndSummaryDate(String robotId, LocalDate summaryDate);

    List<KilometrageSummary> findByRobotIdOrderBySummaryDateAsc(String robotId);

    Optional<KilometrageSummary> findFirstByRobotIdOrderBySummaryDateDesc(String robotId);
}
