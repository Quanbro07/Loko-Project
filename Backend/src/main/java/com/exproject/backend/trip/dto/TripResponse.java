package com.exproject.backend.trip.dto;

import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.info.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripResponse {

    private Long tripId;

    private String tripName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer numAdult;

    private Integer numChild;

    private Integer numElder;

    private TripStatus status;

    private LocalDateTime createAt;

    public TripResponse(Trip trip) {
        this.tripId = trip.getId();

        this.tripName = trip.getTripName();
        this.startDate = trip.getStartDate();
        this.endDate = trip.getEndDate();
        this.numAdult = trip.getNumAdult();
        this.numChild = trip.getNumChild();
        this.numElder = trip.getNumElder();
        this.status = trip.getStatus();
        this.createAt = trip.getCreateAt();
    }
}
