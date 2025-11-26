package com.exproject.backend.location.dto;

import com.exproject.backend.location.Location;
import com.exproject.backend.location_category.dto.LocationCategoryResponse;
import com.exproject.backend.location_img.dto.LocationImgResponse;
import com.exproject.backend.province.info.Province;
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
public class LocationResponse {

    private Long id;

    private String ggPlaceId;

    private Long provinceId;

    private String provinceName;

    private String locationName;

    private Double latitude;

    private Double longitude;

    private LocalTime openTime;

    private LocalTime closeTime;

    private Long avgVisitTime;

    private Double ticketPrice;

    private String description;

    private List<LocationImgResponse> locationImgs;

    private List<LocationCategoryResponse> locationCategories;


    // Constructor
    public LocationResponse(Location location) {
        Province province = location.getProvince();

        this.id = location.getId();
        this.provinceId = province.getId();
        this.provinceName = province.getProvinceName();
        this.locationName = location.getLocationName();
        this.latitude = location.getLatitude();
        this.longitude = location.getLongitude();
        this.openTime = location.getOpenTime();
        this.closeTime = location.getCloseTime();
        this.avgVisitTime = location.getAvgVisitTime();
        this.ticketPrice = location.getTicketPrice();
        this.ggPlaceId = location.getGgPlaceId();
    }
}
