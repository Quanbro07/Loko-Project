package com.exproject.backend.trip.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TripRequest {

    private Long userId;

    private String tripName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer numAdult;

    private Integer numChild;

    private Integer numElder;

    private Integer status;
}
