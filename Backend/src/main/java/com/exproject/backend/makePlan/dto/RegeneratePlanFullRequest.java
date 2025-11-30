package com.exproject.backend.makePlan.dto;

import com.exproject.backend.location.dto.LocationIdDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegeneratePlanFullRequest {
    @JsonProperty("rejected_locations")
    private List<LocationIdDTO> rejectedLocations;

    @JsonProperty("make_plan_request")
    private MakePlanRequest makePlanRequest;
}
