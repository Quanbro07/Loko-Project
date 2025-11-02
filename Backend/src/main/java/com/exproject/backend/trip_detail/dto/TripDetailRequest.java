package com.exproject.backend.trip_detail.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripDetailRequest {

    private Long tripSectionId;

    private Long locationId; // có thể null

    private Integer sequenceOrder;

    private LocalTime startTime;

    private LocalTime endTime;

    private String transportNote;

}
