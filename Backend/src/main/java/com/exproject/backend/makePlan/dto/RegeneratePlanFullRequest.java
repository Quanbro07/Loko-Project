package com.exproject.backend.makePlan.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegeneratePlanFullRequest {
    @JsonProperty("location_ids")
    private List<Long> locationIds;

    private MakePlanRequest makePlanRequest;
}
