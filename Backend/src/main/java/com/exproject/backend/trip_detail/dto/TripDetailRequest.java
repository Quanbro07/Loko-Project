package com.exproject.backend.trip_detail.dto;

import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_img.dto.LocationImgDTO;
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

    private Integer sequenceOrder;

    private LocalTime startTime;

    private LocalTime endTime;

    private String transportNote;

    private String description;

    private LocationDTO location;
}
