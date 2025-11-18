package com.exproject.backend.trip_detail.dto;

import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.trip_detail.TripDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private LocalTime startTime;

    private LocalTime endTime;

    private String transportNote;

    private String description;

    private LocationResponse location;

}
