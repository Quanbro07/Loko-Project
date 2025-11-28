package com.exproject.backend.makePlan.dto;

import com.exproject.backend.hobby.info.EHobby;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location.dto.LocationIdDTO;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.province.info.EProvince;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MakePlanRequest {
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private EProvince province;

    private EHobby hobby;

    // True đi 1 người
    // False đi nhóm
    private Boolean isAlone;

    private Boolean isChildren;

    @PositiveOrZero
    private Integer numChildren;

    @PositiveOrZero
    private Integer numAdults;

    private Boolean isElder;

    @PositiveOrZero
    private Integer numElders;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime fromOperateTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime toOperateTime;

    @JsonProperty("locations")
    private List<LocationDTO> locations;

    @JsonProperty("visited_locations")
    private List<LocationIdDTO> visitedLocations;
}
