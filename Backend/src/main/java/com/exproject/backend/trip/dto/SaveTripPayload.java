package com.exproject.backend.trip.dto;

import com.exproject.backend.route.dto.RouteResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SaveTripPayload {
    @JsonProperty("trip_request")
    private TripRequest tripRequest;

    @JsonProperty("route_response")
    private RouteResponse routeResponse;
}
