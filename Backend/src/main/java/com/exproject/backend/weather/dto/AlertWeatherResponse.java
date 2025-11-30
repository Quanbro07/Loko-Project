package com.exproject.backend.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AlertWeatherResponse {
    @JsonProperty("headline")
    private String headline;

    @JsonProperty("desc")
    private String description;

    @JsonProperty("severity")
    private String severity;

    @JsonProperty("areas")
    private String areas;
}
