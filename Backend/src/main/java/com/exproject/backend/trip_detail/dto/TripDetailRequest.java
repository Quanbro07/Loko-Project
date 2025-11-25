package com.exproject.backend.trip_detail.dto;

import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class TripDetailRequest {
    @JsonProperty("temp_id")
    private Long tempId;

    private Integer sequenceOrder;

    private LocalTime startTime;

    private LocalTime endTime;

    private String transportNote;

    @JsonProperty("activity")
    private String description;

    private LocationDTO location;
}
