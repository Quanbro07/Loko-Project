package com.exproject.backend.trip.dto;

import com.exproject.backend.trip_section.dto.TripSectionRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripRequest {

    private Long userId;

    private String tripName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer numAdult;

    private Integer numChild;

    private Integer numElder;

    private List<TripSectionRequest> tripSections;
}
