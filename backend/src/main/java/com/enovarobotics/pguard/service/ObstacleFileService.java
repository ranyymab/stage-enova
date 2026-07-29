package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.dto.ObstacleProgressDto;
import com.enovarobotics.pguard.model.entity.ObstacleProgress;
import com.enovarobotics.pguard.repository.ObstacleProgressRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObstacleFileService {

    private final ObstacleProgressRepository repository;
    private final RobotDataParsingUtils parsingUtils;
    private final ObjectMapper objectMapper;

    public int parseAndSave(InputStream jsonStream, String robotId) throws IOException {
        List<ObstacleProgressDto> records = objectMapper.readValue(
                jsonStream,
                objectMapper.getTypeFactory().constructCollectionType(List.class, ObstacleProgressDto.class)
        );

        int saved = 0;
        for (ObstacleProgressDto dto : records) {
            var date = parsingUtils.parseRobotDate(dto.getDate());
            var hour = parsingUtils.parseRobotHour(dto.getHour());

            ObstacleProgress entity = ObstacleProgress.builder()
                    .robotId(robotId)
                    .rawDate(dto.getDate())
                    .rawHour(dto.getHour())
                    .eventDate(date)
                    .eventDatetime(parsingUtils.combine(date, hour))
                    .missionName(dto.getMissionName())
                    .lastPoint(dto.getLastPoint())
                    .delaySeconds(parsingUtils.parseNumericStringOrNull(dto.getDelay()))
                    .latitude(parsingUtils.nanToNull(dto.getLatitude()))
                    .longitude(parsingUtils.nanToNull(dto.getLongitude()))
                    .build();

            repository.save(entity);
            saved++;
        }

        log.info("{} enregistrement(s) Obstacle (progression d'inspection) sauvegardé(s) pour {}", saved, robotId);
        return saved;
    }
}
