package com.exproject.backend.route.dto;

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
public class SectionRouteResponse {
    @JsonProperty("day_num")
    private Integer dayNumber;

    @JsonProperty("route_path")
    private List<RoutePathResponse> routePath;
}
