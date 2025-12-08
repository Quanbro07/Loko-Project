package com.exproject.backend.weather.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HourlyWeatherResponse {
    @JsonProperty("time")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime time;

    @JsonProperty("temp_c")
    private Double tempC;

    @JsonProperty("will_it_rain")
    private Integer willRain;

    @JsonProperty("condition")
    private ConditionWeatherResponse condition;
}
