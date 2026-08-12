package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO pour la catégorie "Detection" — structure simple réelle, sans
 * préfixes numériques : hour, objectDetected, gps{latitude,longitude},
 * image{fileName,filePath}. Pas de champ de criticité fourni par le robot
 * (attribué par le backend, voir DetectionEvent).
 */
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
