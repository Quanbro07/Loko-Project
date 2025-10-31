package com.exproject.backend.location.dto;

public class LocationResponse {

    private Long id;
    private Long provinceId;
    private String provinceName;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String openTime;
    private String avgVisitTime;
    private Double ticketPrice;
    private String ggPlaceId;

    public LocationResponse() {
    }

    public LocationResponse(Long id, Long provinceId, String provinceName,
                            String locationName, Double latitude, Double longitude,
                            String openTime, String avgVisitTime,
                            Double ticketPrice, String ggPlaceId) {
        this.id = id;
        this.provinceId = provinceId;
        this.provinceName = provinceName;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.openTime = openTime;
        this.avgVisitTime = avgVisitTime;
        this.ticketPrice = ticketPrice;
        this.ggPlaceId = ggPlaceId;
    }

    public Long getId() {
        return id;
    }

    public Long getProvinceId() {
        return provinceId;
    }

    public String getProvinceName() {
        return provinceName;
    }

    public String getLocationName() {
        return locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getOpenTime() {
        return openTime;
    }

    public String getAvgVisitTime() {
        return avgVisitTime;
    }

    public Double getTicketPrice() {
        return ticketPrice;
    }

    public String getGgPlaceId() {
        return ggPlaceId;
    }
}
