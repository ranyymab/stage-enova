package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.dto.MissionLikeEventDto;
import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.repository.MissionEventRepository;
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
public class MissionLikeFileService {

    private final MissionEventRepository repository;
    private final RobotDataParsingUtils parsingUtils;
    private final ObjectMapper objectMapper;

    public int parseAndSave(InputStream jsonStream, MissionEvent.EventCategory category, String robotId) throws IOException {
        List<MissionLikeEventDto> records = objectMapper.readValue(
                jsonStream,
                objectMapper.getTypeFactory().constructCollectionType(List.class, MissionLikeEventDto.class)
        );

        int saved = 0;
        for (MissionLikeEventDto dto : records) {
            var date = parsingUtils.parseRobotDate(dto.getDate());
            var hour = parsingUtils.parseRobotHour(dto.getHour());

            MissionEvent entity = MissionEvent.builder()
                    .category(category)
                    .robotId(robotId)
                    .info(dto.getInfo())
                    .missionName(dto.getMissionName())
                    .rawDate(dto.getDate())
                    .rawHour(dto.getHour())
                    .eventDate(date)
                    .eventDatetime(parsingUtils.combine(date, hour))
                    .notes(dto.getNotes())
                    .startPoint(dto.getStartPoint())
                    .stopPoint(dto.getStopPointFromEnd())
                    .lastPoint(dto.getLastPointFromPause())
                    .distanceKm(parsingUtils.parseNumericStringOrNull(dto.getDistance()))
                    .batteryLevel(dto.getBattery())
                    .dockingState(dto.getDockingState())
                    .latitude(parsingUtils.nanToNull(dto.resolveLatitude()))
                    .longitude(parsingUtils.nanToNull(dto.resolveLongitude()))
                    .build();

            repository.save(entity);
            saved++;
        }

        log.info("{} enregistrement(s) {} sauvegardé(s) pour {}", saved, category, robotId);
        return saved;
    }
}
