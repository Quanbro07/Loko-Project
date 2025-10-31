package com.exproject.backend.trip_detail.dto;

import java.time.LocalTime;

public class TripDetailRequest {

    private Long tripSectionId;
    private Long locationId; // có thể null
    private Integer sequenceOrder;
    private LocalTime startTime;
    private LocalTime endTime;
    private String transportNote;

    public Long getTripSectionId() {
        return tripSectionId;
    }

    public void setTripSectionId(Long tripSectionId) {
        this.tripSectionId = tripSectionId;
    }

    public Long getLocationId() {
        return locationId;
    }

    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getTransportNote() {
        return transportNote;
    }

    public void setTransportNote(String transportNote) {
        this.transportNote = transportNote;
    }
}
