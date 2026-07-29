package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.dto.KilometrageSummaryDto;
import com.enovarobotics.pguard.model.entity.KilometrageSummary;
import com.enovarobotics.pguard.repository.KilometrageSummaryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;

/**
 * Service de parsing pour "Kilometrage" — SEULE catégorie nécessitant un
 * UPSERT plutôt qu'une insertion simple, car le robot écrase le fichier du
 * jour à chaque mise à jour (cf. cahier des charges, section 2.2.4 et
 * 3.2.2). La date du résumé est déduite de la date d'upload (le nom de
 * fichier est la seule source de date pour cette catégorie, le contenu
 * JSON n'en contenant pas).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KilometrageFileService {

    private final KilometrageSummaryRepository repository;
    private final ObjectMapper objectMapper;

    public void parseAndUpsert(InputStream jsonStream, String robotId, LocalDate summaryDate) throws IOException {
        KilometrageSummaryDto dto = objectMapper.readValue(jsonStream, KilometrageSummaryDto.class);

        KilometrageSummary entity = repository
                .findByRobotIdAndSummaryDate(robotId, summaryDate)
                .orElseGet(() -> KilometrageSummary.builder()
                        .robotId(robotId)
                        .summaryDate(summaryDate)
                        .build());

        entity.setLastUpdate(dto.getLastUpdate());
        entity.setDistanceKm(dto.getDistanceKm());
        entity.setDynamicPercentage(dto.getDynamicPercentage());
        entity.setDynamicMinutes(dto.getDynamicMinutes());
        entity.setStaticMinutes(dto.getStaticMinutes());
        entity.setTotalMinutes(dto.getTotalMinutes());

        repository.save(entity);
        log.info("Kilometrage upserté pour {} le {} (distance={} km)", robotId, summaryDate, dto.getDistanceKm());
    }
}
