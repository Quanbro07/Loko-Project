package com.exproject.backend.trip_detail.dto;

import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.route.dto.RoutePathResponse;
import com.exproject.backend.trip_detail.TripDetail;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripDetailResponse {
    private Long id;

    private Long tripSectionId;

    private Long locationId;

    private Integer sequenceOrder;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime endTime;

    private String transportNote;

    @JsonProperty("activity")
    private String description;

    private LocationResponse location;

}
