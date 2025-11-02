package com.exproject.backend.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationResponse {

    private String provinceName;

    private String locationName;

    private Double latitude;

    private Double longitude;

    private String openTime;

    private String avgVisitTime;

    private Double ticketPrice;

    private String ggPlaceId;

}
