package com.exproject.backend.trip.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TripResponse {

    private Long id;

    private Long userId;

    private String tripName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer numAdult;

    private Integer numChild;

    private Integer numElder;

    private Integer status;

    private LocalDateTime createAt;
}
