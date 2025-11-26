package com.exproject.backend.makePlan.dto;

import com.exproject.backend.trip.dto.TripRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegeneratePlanPartRequest {
    @JsonProperty("current_trip_plan")
    private TripRequest currentTrip;

    @JsonProperty("rejected_detail")
    private List<RejectedPlanPartDTO> rejectedDetail;
}
