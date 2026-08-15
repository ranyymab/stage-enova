package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MissionLikeEventDto {

    @JsonProperty("0-Info")
    private String info;

    @JsonProperty("1-Mission_name")
    private String missionName;

    @JsonProperty("1-State")
    private String dockingState;

    @JsonProperty("2-Date")
    private String date;

    @JsonProperty("3-Hour")
    private String hour;

    @JsonProperty("4-Notes")
    private String notes;

    @JsonProperty("4-Battery")
    private Integer battery;

    @JsonProperty("5-Start_point")
    private String startPoint;

    @JsonProperty("6-Distance")
    private String distance;

    @JsonProperty("5-Stop_point")
    private String stopPointFromEnd;

    @JsonProperty("5-Last_point")
    private String lastPointFromPause;

    @JsonProperty("5-Latitude")
    private Double latitude5;

    @JsonProperty("7-Latitude")
    private Double latitude7;

    @JsonProperty("6-Latitude")
    private Double latitude6;

    @JsonProperty("8-Longitude")
    private Double longitude8;

    @JsonProperty("7-Longitude")
    private Double longitude7;

    @JsonProperty("6-Longitude")
    private Double longitude6;

    public boolean isDockingLifecycleFormat() {
        return dockingState != null || battery != null
                || "docking".equalsIgnoreCase(info) || "undocking".equalsIgnoreCase(info);
    }

    public String resolveStopOrLastPoint() {
        return stopPointFromEnd != null ? stopPointFromEnd : lastPointFromPause;
    }

    public Double resolveLatitude() {
        if (isDockingLifecycleFormat()) {
            return latitude5;
        }
        return latitude7 != null ? latitude7 : latitude6;
    }

    public Double resolveLongitude() {
        if (isDockingLifecycleFormat()) {
            return longitude6;
        }
        return longitude8 != null ? longitude8 : longitude7;
    }
}
