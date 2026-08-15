package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.dto.DetectionEventDto;
import com.enovarobotics.pguard.model.entity.DetectionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DetectionFileService {

    private final DetectionEventRepository repository;
    private final RobotDataParsingUtils parsingUtils;
    private final ObjectMapper objectMapper;

    public int parseAndSave(InputStream jsonStream, String robotId, LocalDate eventDate) throws IOException {
        List<DetectionEventDto> records = objectMapper.readValue(
                jsonStream,
                objectMapper.getTypeFactory().constructCollectionType(List.class, DetectionEventDto.class)
        );

        int saved = 0;
        for (DetectionEventDto dto : records) {
            LocalTime hour = parsingUtils.parseRobotHour(dto.getHour());
            Double lat = dto.getGps() != null ? dto.getGps().getLatitude() : null;
            Double lng = dto.getGps() != null ? dto.getGps().getLongitude() : null;

            DetectionEvent entity = DetectionEvent.builder()
                    .robotId(robotId)
                    .eventDate(eventDate)
                    .rawHour(dto.getHour())
                    .eventDatetime(parsingUtils.combine(eventDate, hour))
                    .objectDetected(dto.getObjectDetected())
                    .latitude(parsingUtils.nanToNull(lat))
                    .longitude(parsingUtils.nanToNull(lng))
                    .imageFileName(dto.getImage() != null ? dto.getImage().getFileName() : null)
                    .imageFilePath(dto.getImage() != null ? dto.getImage().getFilePath() : null)
                    .criticite(classify(dto.getObjectDetected()))
                    .statut(DetectionEvent.StatutAnomalie.NOUVELLE)
                    .build();

            repository.save(entity);
            saved++;
        }

        log.info("{} détection(s) sauvegardée(s) pour {} le {}", saved, robotId, eventDate);
        return saved;
    }

    private DetectionEvent.Criticite classify(String objectDetected) {
        if (objectDetected == null) return DetectionEvent.Criticite.MOYENNE;
        return switch (objectDetected.toLowerCase()) {
            case "person" -> DetectionEvent.Criticite.HAUTE;
            case "vehicle" -> DetectionEvent.Criticite.MOYENNE;
            case "animal" -> DetectionEvent.Criticite.FAIBLE;
            default -> DetectionEvent.Criticite.MOYENNE;
        };
    }
}
