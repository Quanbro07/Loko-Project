package com.exproject.backend.trip_history.dto;

import com.exproject.backend.trip_history.TripHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TripHistoryResponse {
    private Long id;

    private Long userId;

    private Long tripId;

    private LocalDate visitDate;

    public TripHistoryResponse(TripHistory tripHistory) {
        this.id = tripHistory.getId();
        this.userId = tripHistory.getUser().getId();
        this.tripId = tripHistory.getTrip().getId();
        this.visitDate = tripHistory.getVisitDate();
    }
}
