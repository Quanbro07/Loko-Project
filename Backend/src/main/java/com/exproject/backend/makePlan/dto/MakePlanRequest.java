package com.exproject.backend.makePlan.dto;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.province.info.EProvince;
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
    private LocalDate startDate;

    private LocalDate endDate;

    private EProvince province;

    // True đi 1 người
    // False đi nhóm
    private Boolean isAlone;

    private Boolean isChildren;

    @PositiveOrZero
    private Integer numChildren;

    @PositiveOrZero
    private Integer numAdults;

    private Boolean IsElder;

    @PositiveOrZero
    private Integer numElders;

    private List<ELocationCategory> locationCategories;

    private List<LocalTime> fromOperateTime;

    private List<LocalTime> toOperateTime;

    private List<LocationDTO> locaitons;
}
