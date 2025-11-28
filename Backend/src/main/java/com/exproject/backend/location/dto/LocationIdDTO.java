package com.exproject.backend.location.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationIdDTO {
    @JsonProperty("location_id")
    private Long locationId;

    @JsonProperty("gg_place_id")
    private String ggPlaceId;
}
