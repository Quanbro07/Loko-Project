package com.exproject.backend.trip.dto;

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

    private String tripName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer numAdult;

    private Integer numChild;

    private Integer numElder;

    private Integer status;

    private LocalDateTime createAt;
}
