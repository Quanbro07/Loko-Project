package com.exproject.backend.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationRequest {

    private Long provinceId;

    private String locationName;

    private Double latitude;

    private Double longitude;

    private LocalTime openTime;

    private LocalTime closeTime;

    private Long avgVisitTime;

    private Double ticketPrice;

    private String description;

    private String ggPlaceId;

}
