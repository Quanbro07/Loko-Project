package com.exproject.backend.route.dto;

import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequest {
    @JsonProperty("trip_section_requests")
    private List<TripSectionRouteRequest> tripSectionRequests;
}
