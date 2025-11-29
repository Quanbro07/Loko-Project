package com.exproject.backend.weather.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WeatherSectionResponse {
    @JsonProperty("scope")
    private Integer dayNum;

    @JsonProperty("date")
    @JsonFormat(shape = JsonFormat.Shape.STRING,pattern = "yyyy-mm-dd")
    private LocalDate date;

    @JsonProperty("hourly_weather")
    private List<HourlyWeatherResponse> hourlyWeathers;
}
