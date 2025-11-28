package com.exproject.backend.trip_history.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripHistoryRequest {
    private Long userId;

    private long tripId;
}
