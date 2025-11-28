package com.exproject.backend.route.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LocationRoute {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("gg_palce_id")
    private String ggPlaceId;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;
}
