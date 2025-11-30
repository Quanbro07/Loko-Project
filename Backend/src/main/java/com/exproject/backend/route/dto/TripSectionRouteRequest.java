package com.exproject.backend.route.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TripSectionRouteRequest {
    @JsonProperty("dayNumber")
    private Integer dayNumber;

    @JsonProperty("trip_detail_routes")
    private List<TripDetailRouteRequest> tripDetailRoutes;
}
