package com.enovarobotics.pguard.controller;

import com.enovarobotics.pguard.model.entity.ObstacleProgress;
import com.enovarobotics.pguard.repository.ObstacleProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inspection")
@RequiredArgsConstructor
public class InspectionController {

    private final ObstacleProgressRepository repository;

    @GetMapping
    public List<ObstacleProgress> getInspectionPoints(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (date != null) {
            return repository.findByEventDateOrderByEventDatetimeAsc(date);
        }

        return repository.findByEventDateLessThanEqualOrderByEventDatetimeDesc(LocalDate.now());
    }
}
