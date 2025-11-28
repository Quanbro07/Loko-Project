package com.exproject.backend.route.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TripDetailRoute {
    @JsonProperty("sequenceOrder")
    private Integer sequenceOrder;

    private LocationRoute locationRoute;
}
