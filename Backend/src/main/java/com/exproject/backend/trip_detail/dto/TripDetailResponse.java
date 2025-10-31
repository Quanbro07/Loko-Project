package com.exproject.backend.trip_detail.dto;

import java.time.LocalTime;

public class TripDetailResponse {

    private Long id;
    private Long tripSectionId;
    private Long locationId;
    private Integer sequenceOrder;
    private LocalTime startTime;
    private LocalTime endTime;
    private String transportNote;

    public TripDetailResponse() {
    }

    public TripDetailResponse(Long id, Long tripSectionId, Long locationId,
                              Integer sequenceOrder, LocalTime startTime,
                              LocalTime endTime, String transportNote) {
        this.id = id;
        this.tripSectionId = tripSectionId;
        this.locationId = locationId;
        this.sequenceOrder = sequenceOrder;
        this.startTime = startTime;
        this.endTime = endTime;
        this.transportNote = transportNote;
    }

    public Long getId() {
        return id;
    }

    public Long getTripSectionId() {
        return tripSectionId;
    }

    public Long getLocationId() {
        return locationId;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getTransportNote() {
        return transportNote;
    }
}
