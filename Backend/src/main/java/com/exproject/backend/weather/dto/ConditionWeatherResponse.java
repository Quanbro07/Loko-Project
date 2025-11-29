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
public class ConditionWeatherResponse {
    @JsonProperty("text")
    private String text;

    @JsonProperty("icon")
    private String iconURL;
}
