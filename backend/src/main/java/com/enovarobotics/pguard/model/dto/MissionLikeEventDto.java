package com.enovarobotics.pguard.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO partagé pour les catégories au format "mission-like" : Mission,
 * Inspecting, Back_home. Sert aussi de DTO d'entrée pour Docking, qui
 * mélange en réalité DEUX formats différents dans le même fichier (constaté
 * sur les vrais fichiers, absent du cahier des charges initial) :
 *
 * Format A — "mission-like" (Mission, Inspecting, Back_home, et les
 * enregistrements "start" mêlés aux fichiers Docking) :
 *   start : "0-Info"=start, "1-Mission_name", "5-Start_point", "6-Distance", "7-Latitude", "8-Longitude"
 *   end   : "0-Info"=end,   "1-Mission_name", "5-Stop_point",                "6-Latitude", "7-Longitude"
 *   pause : "0-Info"=pause, "1-Mission_name", "5-Last_point",                "6-Latitude", "7-Longitude"
 *
 * Format B — "docking lifecycle" (uniquement dans les fichiers Docking) :
 *   "0-Info": "docking" | "undocking"
 *   "1-State": "start" | "success" | "failed" | "restart n=N"
 *   "4-Battery": niveau de batterie (%)
 *   "5-Latitude" / "6-Longitude"
 *
 * Tous les champs possibles sont déclarés optionnels ici et lus par NOM DE
 * CLÉ JSON (pas par position), pour rester robuste à ces décalages.
 * @JsonIgnoreProperties(ignoreUnknown = true) tolère toute variation
 * supplémentaire non prévue.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MissionLikeEventDto {

    @JsonProperty("0-Info")
    private String info; // start | end | pause (format A) ou docking | undocking (format B)

    @JsonProperty("1-Mission_name")
    private String missionName;

    /** Uniquement format B : start | success | failed | "restart n=N" */
    @JsonProperty("1-State")
    private String dockingState;

    @JsonProperty("2-Date")
    private String date;

    @JsonProperty("3-Hour")
    private String hour;

    @JsonProperty("4-Notes")
    private String notes;

    /** Uniquement format B : niveau de batterie (%) au moment de l'evenement */
    @JsonProperty("4-Battery")
    private Integer battery;

    /** Présent uniquement sur "start" (format A) */
    @JsonProperty("5-Start_point")
    private String startPoint;

    /** Présent uniquement sur "start" (format A) ; peut valoir "Unknown" (chaîne, pas un nombre) */
    @JsonProperty("6-Distance")
    private String distance;

    /** Présent uniquement sur "end" (format A) */
    @JsonProperty("5-Stop_point")
    private String stopPointFromEnd;

    /** Présent uniquement sur "pause" (format A) */
    @JsonProperty("5-Last_point")
    private String lastPointFromPause;

    /** Format B uniquement : latitude au lieu de 6/7-Latitude du format A */
    @JsonProperty("5-Latitude")
    private Double latitude5;

    /** Format A "start" : latitude à l'index 7 */
    @JsonProperty("7-Latitude")
    private Double latitude7;

    /** Format A "end"/"pause" : latitude à l'index 6 */
    @JsonProperty("6-Latitude")
    private Double latitude6;

    /** Format A "start" : longitude à l'index 8 */
    @JsonProperty("8-Longitude")
    private Double longitude8;

    /** Format A "end"/"pause" : longitude à l'index 7 */
    @JsonProperty("7-Longitude")
    private Double longitude7;

    /** Format B uniquement : longitude à l'index 6 */
    @JsonProperty("6-Longitude")
    private Double longitude6;

    /** true si l'enregistrement suit le format B (docking/undocking), reconnu par la présence de "1-State"/"4-Battery", ou par "0-Info". */
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
