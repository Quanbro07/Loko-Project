package com.exproject.backend.trip_section.dto;

public class TripSectionResponse {

    private Long id;
    private Long tripId;
    private Integer dayNumber;
    private String title;
    private String description;

    public TripSectionResponse() {
    }

    public TripSectionResponse(Long id, Long tripId, Integer dayNumber, String title, String description) {
        this.id = id;
        this.tripId = tripId;
        this.dayNumber = dayNumber;
        this.title = title;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public Long getTripId() {
        return tripId;
    }

    public Integer getDayNumber() {
        return dayNumber;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
