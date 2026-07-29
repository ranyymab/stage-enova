package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO pour la catégorie "Obstacle" — contient en réalité la progression
 * d'inspection (Last_point, Delay), voir note dans ObstacleProgress.java.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ObstacleProgressDto {

    @JsonProperty("0-Date")
    private String date;

    @JsonProperty("1-Hour")
    private String hour;

    @JsonProperty("2-Mission_name")
    private String missionName;

    @JsonProperty("3-Last_point")
    private String lastPoint;

    /** Chaîne dans les fichiers réels (ex: "52.4001100063"), convertie en Double par le service */
    @JsonProperty("4-Delay")
    private String delay;

    @JsonProperty("5-Latitude")
    private Double latitude;

    @JsonProperty("6-Longitude")
    private Double longitude;
}
