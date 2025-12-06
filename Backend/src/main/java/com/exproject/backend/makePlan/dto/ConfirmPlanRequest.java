package com.exproject.backend.makePlan.dto;

import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.weather.dto.WeatherRequest;
import com.exproject.backend.weather.dto.WeatherRequestFE;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class ConfirmPlanRequest {
    @JsonProperty("trip_request")
    private TripRequest tripRequest;

    @JsonProperty("weather_request")
    private WeatherRequestFE weatherRequest;
}
