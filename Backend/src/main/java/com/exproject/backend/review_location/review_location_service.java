package com.exproject.backend.review_location;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.trip.Trip;
import com.exproject.backend.trip.TripRepository;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class review_location_service {

    private final review_location_repository reviewLocationRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final TripRepository tripRepository;

    public review_location_service(review_location_repository reviewLocationRepository,
                                   UserRepository userRepository,
                                   LocationRepository locationRepository,
                                   TripRepository tripRepository) {
        this.reviewLocationRepository = reviewLocationRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.tripRepository = tripRepository;
    }

    public review_location create(Long userId, Long locationId, Long tripId,
                                  Integer rating, String comment) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        review_location rl = new review_location();
        rl.setUser(user);
        rl.setLocation(location);
        rl.setRating(rating);
        rl.setComment(comment);

        if (tripId != null) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new RuntimeException("Trip not found"));
            rl.setTrip(trip);
        }

        return reviewLocationRepository.save(rl);
    }

    public List<review_location> getByLocation(Long locationId) {
        return reviewLocationRepository.findByLocation_Id(locationId);
    }

    public List<review_location> getByUser(Long userId) {
        return reviewLocationRepository.findByUser_Id(userId);
    }
}
