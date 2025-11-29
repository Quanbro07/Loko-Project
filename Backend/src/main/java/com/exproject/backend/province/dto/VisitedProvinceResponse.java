package com.exproject.backend.province.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitedProvinceResponse {
    @JsonProperty("total_visited")
    private int totalVisited;

    @JsonProperty("visited_provinces")
    private List<ProvinceDTO> visitedProvinces;
}
