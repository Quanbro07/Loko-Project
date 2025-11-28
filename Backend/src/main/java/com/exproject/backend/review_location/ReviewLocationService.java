package com.exproject.backend.review_location;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.review_location.dto.ReviewLocationRequest;
import com.exproject.backend.review_location.dto.ReviewLocationResponse;
import com.exproject.backend.trip.TripRepository;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewLocationService {

    private final ReviewLocationRepository reviewLocationRepository;

    private final UserRepository userRepository;

    private final LocationRepository locationRepository;

    private final TripRepository tripRepository;

    // Tạo mơới Review Location
    public ReviewLocationResponse createReviewLocation(ReviewLocationRequest reviewLocationRequest) {
        User user = userRepository.findById(reviewLocationRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Location location = locationRepository.findById(reviewLocationRequest.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        // Tạo mới Review Location
        ReviewLocation reviewLocation = new ReviewLocation(reviewLocationRequest);

        // Add mối quan hệ 2 chiều
        user.addReviewLocation(reviewLocation);
        location.addReviewLocation(reviewLocation);

        Optional<Trip> tripOpt = tripRepository.findById(reviewLocationRequest.getTripId());

        // Optional có thể gắn trip hoặc 0
        if(tripOpt.isPresent()) {
            Trip trip = tripOpt.get();
            trip.addReviewLocation(reviewLocation);
        }

        // Lưu vào Db
        reviewLocationRepository.save(reviewLocation);

        ReviewLocationResponse reviewLocationResponse = reviewLocationConvert(reviewLocation);

        return reviewLocationResponse;
    }

    @Cacheable(value = "review_locations",
            key = "#locationId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ReviewLocationResponse> getReviewLocations(Long locationId, Pageable pageable) {
        Page<ReviewLocation> pageReviewLocationList = reviewLocationRepository
                .findByLocation_Id(locationId,pageable);

        return pageReviewLocationList.map(this::reviewLocationConvert);
    }

    // Helper Function
    private ReviewLocationResponse reviewLocationConvert(ReviewLocation reviewLocation) {
        return ReviewLocationResponse.builder()
                .id(reviewLocation.getId())
                .userId(reviewLocation.getUser().getId())
                .userName(reviewLocation.getUser().getUsername())
                .locationId(reviewLocation.getLocation().getId())
                .tripId(reviewLocation.getTrip().getId())
                .rating(reviewLocation.getRating())
                .comment(reviewLocation.getComment())
                .createdAt(reviewLocation.getCreateAt())
                .build();
    }

}
