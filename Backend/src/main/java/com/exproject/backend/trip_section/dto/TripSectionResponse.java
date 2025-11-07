package com.exproject.backend.trip_section.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripSectionResponse {

    private Long id;
    private Long tripId;
    private Integer dayNumber;
    private String title;
    private String description;

}
