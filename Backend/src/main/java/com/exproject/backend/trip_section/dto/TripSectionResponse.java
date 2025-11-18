package com.exproject.backend.trip_section.dto;

import com.exproject.backend.trip_detail.dto.TripDetailResponse;
import com.exproject.backend.trip_section.TripSection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripSectionResponse {

    private Long id;

    private Long tripId;

    private Integer dayNumber;

    private String title;

    private List<TripDetailResponse> tripDetails;

}
