package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.KilometrageSummary;
import com.enovarobotics.pguard.repository.KilometrageSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/kilometrage")
@RequiredArgsConstructor
public class KilometrageController {

    private final KilometrageSummaryRepository repository;

    @Value("${app.robot-id:ROBOT-001}")
    private String robotId;

    @GetMapping
    public List<KilometrageSummary> getHistorique() {
        LocalDate today = LocalDate.now();

        return repository.findByRobotIdOrderBySummaryDateAsc(robotId).stream()
                .filter(km -> !km.getSummaryDate().isAfter(today))
                .toList();
    }
}
