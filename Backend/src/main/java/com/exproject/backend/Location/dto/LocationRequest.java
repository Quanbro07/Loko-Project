package com.exproject.backend.location.dto;

public class LocationRequest {

    private Long provinceId;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String openTime;
    private String avgVisitTime;
    private Double ticketPrice;
    private String ggPlaceId;

    public Long getProvinceId() {
        return provinceId;
    }

    public void setProvinceId(Long provinceId) {
        this.provinceId = provinceId;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getOpenTime() {
        return openTime;
    }

    public void setOpenTime(String openTime) {
        this.openTime = openTime;
    }

    public String getAvgVisitTime() {
        return avgVisitTime;
    }

    public void setAvgVisitTime(String avgVisitTime) {
        this.avgVisitTime = avgVisitTime;
    }

    public Double getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(Double ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public String getGgPlaceId() {
        return ggPlaceId;
    }

    public void setGgPlaceId(String ggPlaceId) {
        this.ggPlaceId = ggPlaceId;
    }
}
