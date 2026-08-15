package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class DetectionEventDto {

    private String hour;

    private String objectDetected;

    private GpsDto gps;

    private ImageDto image;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GpsDto {
        private Double latitude;
        private Double longitude;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImageDto {
        private String fileName;
        private String filePath;
    }
}
