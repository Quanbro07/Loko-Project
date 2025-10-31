package com.exproject.backend.trip;

import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public List<TripResponse> getAll() {
        return tripRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TripResponse create(TripRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = Trip.builder()
                .user(user)
                .tripName(request.getTripName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .numAdult(request.getNumAdult())
                .numChild(request.getNumChild())
                .numElder(request.getNumElder())
                .status(request.getStatus())
                .createAt(LocalDateTime.now())
                .build();

        Trip saved = tripRepository.save(trip);
        return toResponse(saved);
    }

    private TripResponse toResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .userId(trip.getUser() != null ? trip.getUser().getId() : null)
                .tripName(trip.getTripName())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .numAdult(trip.getNumAdult())
                .numChild(trip.getNumChild())
                .numElder(trip.getNumElder())
                .status(trip.getStatus())
                .createAt(trip.getCreateAt())
                .build();
    }
}
