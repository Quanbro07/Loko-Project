package com.exproject.backend.trip;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
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

    private final LocationRepository locationRepository;

    public TripResponse createFullTrip(TripRequest tripRequest) {
        User user = userRepository.findById(tripRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip newTrip = new Trip(tripRequest,user);

        for (TripSectionRequest tripSectionRequest : tripRequest.getTripSections()) {

            TripSection newSection = new TripSection(tripSectionRequest);

            for(TripDetailRequest tripDetailRequest : tripSectionRequest.getTripDetails()) {

                Location location = locationRepository.findById(tripDetailRequest.getLocationId())
                        .orElseThrow(() -> new RuntimeException("Location not found"));

                TripDetail newTripDetail = new TripDetail(tripDetailRequest,location);

                newSection.addTripDetail(newTripDetail);
            }

            newTrip.addTripSection(newSection);
        }

        tripRepository.save(newTrip);

        TripResponse tripResponse = new TripResponse(newTrip);

        return tripResponse;
    }
}
