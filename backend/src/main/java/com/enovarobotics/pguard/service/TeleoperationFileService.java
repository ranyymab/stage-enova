package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.dto.TeleoperationEventDto;
import com.enovarobotics.pguard.model.entity.TeleoperationEvent;
import com.enovarobotics.pguard.repository.TeleoperationEventRepository;
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
public class TeleoperationFileService {

    private final TeleoperationEventRepository repository;
    private final RobotDataParsingUtils parsingUtils;
    private final ObjectMapper objectMapper;

    public int parseAndSave(InputStream jsonStream, String robotId) throws IOException {
        List<TeleoperationEventDto> records = objectMapper.readValue(
                jsonStream,
                objectMapper.getTypeFactory().constructCollectionType(List.class, TeleoperationEventDto.class)
        );

        int saved = 0;
        for (TeleoperationEventDto dto : records) {
            var date = parsingUtils.parseRobotDate(dto.getDate());
            var hour = parsingUtils.parseRobotHour(dto.getHour());

            TeleoperationEvent entity = TeleoperationEvent.builder()
                    .robotId(robotId)
                    .info(dto.getInfo())
                    .rawDate(dto.getDate())
                    .rawHour(dto.getHour())
                    .eventDate(date)
                    .eventDatetime(parsingUtils.combine(date, hour))
                    .mode(dto.getMode())
                    .latitude(parsingUtils.nanToNull(dto.getLatitude()))
                    .longitude(parsingUtils.nanToNull(dto.getLongitude()))
                    .build();

            repository.save(entity);
            saved++;
        }

        log.info("{} enregistrement(s) Teleoperation sauvegardé(s) pour {}", saved, robotId);
        return saved;
    }
}
