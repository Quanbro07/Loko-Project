package com.exproject.backend.location.dto;

import com.exproject.backend.location.Location;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationResponse {

    private Long locationId;

    private String provinceName;

    private String locationName;

    private Double latitude;

    private Double longitude;

    private String openTime;

    private String avgVisitTime;

    private Double ticketPrice;

    private String ggPlaceId;

    // Constructor
    public LocationResponse(Location location) {
        this.locationId = location.getId();
        this.provinceName = location.getProvince().getProvinceName();
        this.locationName = location.getLocationName();
        this.latitude = location.getLatitude();
        this.longitude = location.getLongitude();
        this.openTime = location.getOpenTime();
        this.avgVisitTime = location.getAvgVisitTime();
        this.ticketPrice = location.getTicketPrice();
        this.ggPlaceId = location.getGgPlaceId();
    }
}
