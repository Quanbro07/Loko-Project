package com.exproject.backend.trip.dto;

import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.info.TripStatus;
import com.exproject.backend.trip_section.dto.TripSectionResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private List<TripSectionResponse> tripSections;

    private String pdfFileName;

    private String pdfUrl;
}
