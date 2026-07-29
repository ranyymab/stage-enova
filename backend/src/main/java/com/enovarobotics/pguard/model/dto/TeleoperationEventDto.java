package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TeleoperationEventDto {

    @JsonProperty("0-Info")
    private String info; // start | stop

    @JsonProperty("1-Date")
    private String date;

    @JsonProperty("2-Hour")
    private String hour;

    @JsonProperty("3-Mode")
    private String mode;

    @JsonProperty("4-Latitude")
    private Double latitude;

    @JsonProperty("5-Longitude")
    private Double longitude;
}
