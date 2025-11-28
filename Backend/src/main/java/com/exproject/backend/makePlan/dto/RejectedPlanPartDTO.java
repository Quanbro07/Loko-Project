package com.exproject.backend.makePlan.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectedPlanPartDTO {
    @JsonProperty("trip_detail_id")
    private Long tripDetailId;

    @JsonProperty("location_id")
    private Long locationId;
}
