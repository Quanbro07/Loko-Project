package com.exproject.backend.trip_history;

import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.TripRepository;
import com.exproject.backend.trip_history.dto.TripHistoryRequest;
import com.exproject.backend.trip_history.dto.TripHistoryResponse;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TripHistoryService {

    private final TripHistoryRepository tripHistoryRepository;

    private final TripRepository tripRepository;

    private final UserRepository userRepository;

    @Transactional
    public TripHistoryResponse createTripHistory(TripHistoryRequest tripHistoryRequest) {
        User user = userRepository.findById(tripHistoryRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = tripRepository.findById(tripHistoryRequest.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        TripHistory tripHistory = new TripHistory();

        // Gắn 2 chiều cho cả các entity
        // Lưu khóa ngoại
        // Them tripHistory vào List của User
        // Them tripHistory vào trip
        user.addTripHistory(tripHistory);
        trip.addTripHistory(tripHistory);

        // Thêm ngày đi
        tripHistory.setVisitDate(trip.getStartDate());

        tripHistoryRepository.save(tripHistory);

        TripHistoryResponse tripHistoryResponse = new TripHistoryResponse(tripHistory);

        return tripHistoryResponse;
    }


}
