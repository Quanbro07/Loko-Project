package com.exproject.backend.trip_detail.dto;

import com.exproject.backend.trip_detail.TripDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripDetailResponse {

    private Long tripSectionId;

    private Long locationId;

    private Integer sequenceOrder;

    private LocalTime startTime;

    private LocalTime endTime;

    private String transportNote;


    public TripDetailResponse(TripDetail newTripDetail) {
        this.tripSectionId = newTripDetail.getTripSection().getId();
        this.locationId = newTripDetail.getLocation().getId();
        this.sequenceOrder = newTripDetail.getSequenceOrder();
        this.startTime = newTripDetail.getStartTime();
        this.endTime = newTripDetail.getEndTime();
        this.transportNote = newTripDetail.getTransportNote();
    }
}
