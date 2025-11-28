package com.exproject.backend.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProgressUpdateDTO {
    private Long tripId;

    private Long currentTripSectionId;

    private Long currentTripDetailId;
}
