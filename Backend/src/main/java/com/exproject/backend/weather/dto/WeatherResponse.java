package com.exproject.backend.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WeatherResponse {
    @JsonProperty("scopes")
    List<WeatherSectionResponse> weatherSections;

    @JsonProperty("alerts")
    List<AlertWeatherResponse> alerts;
}
