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
public class RegeneratePlanPartResponse {
    @JsonProperty("fail_trip_detail_ids")
    private List<Long> failedTripDetailIds;

    @JsonProperty("new_trip_plan")
    private TripRequest newTrip;
}
