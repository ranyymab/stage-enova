package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class KilometrageSummaryDto {

    @JsonProperty("last_update")
    private String lastUpdate;

    @JsonProperty("distance_km")
    private Double distanceKm;

    @JsonProperty("dynamic_percentage")
    private Double dynamicPercentage;

    @JsonProperty("dynamic_minutes")
    private Double dynamicMinutes;

    @JsonProperty("static_minutes")
    private Double staticMinutes;

    @JsonProperty("total_minutes")
    private Double totalMinutes;
}
