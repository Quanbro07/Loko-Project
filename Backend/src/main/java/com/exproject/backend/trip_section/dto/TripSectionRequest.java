package com.exproject.backend.trip_section.dto;

import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripSectionRequest {

    private Integer dayNumber;

    private String title;

    private List<TripDetailRequest> tripDetails;
}
