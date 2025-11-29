package com.exproject.backend.makePlan.dto;

import com.exproject.backend.route.dto.RouteResponse;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.weather.dto.WeatherResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakePlanResponse {
    @JsonProperty("trip_plan")
    private TripResponse tripPlan;

    @JsonProperty("route")
    private RouteResponse route;

    @JsonProperty("weather")
    private WeatherResponse weather;

}
