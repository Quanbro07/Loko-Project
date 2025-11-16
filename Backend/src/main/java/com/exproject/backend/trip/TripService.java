package com.exproject.backend.trip;

import com.exproject.backend.categorySyncStat.CategorySyncStatService;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.trip.dto.ProgressUpdateDTO;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.info.TripStatus;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;

    private final UserRepository userRepository;

    private final LocationRepository locationRepository;

    private final CategorySyncStatService categorySyncStatService;

    private final TripMapper tripMapper;

    // * Tạo Full Trip
    public void createFullTrip(TripRequest tripRequest) {
        User user = userRepository.findById(tripRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip newTrip = new Trip(tripRequest,user);

        for (TripSectionRequest tripSectionRequest : tripRequest.getTripSections()) {

            TripSection newSection = new TripSection(tripSectionRequest);

            for(TripDetailRequest tripDetailRequest : tripSectionRequest.getTripDetails()) {

                Location location = locationRepository.findById(tripDetailRequest.getLocationId())
                        .orElseThrow(() -> new RuntimeException("Location not found"));

                // Logic: User chọn địa điểm này -> Hệ thống hiểu User đang quan tâm Tỉnh/Loại này
                categorySyncStatService.increaseCategorySyncStat(location);

                TripDetail newTripDetail = new TripDetail(tripDetailRequest,location);

                newSection.addTripDetail(newTripDetail);
            }

            newTrip.addTripSection(newSection);
        }

        tripRepository.save(newTrip);

    }

    // Khi Trip đã hoàn thành
    public void completeTrip(Long tripId) {
        Trip trip = tripRepository.findTripGraphById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(TripStatus.COMPLETED);

        User user = trip.getUser();

        Set<Province> provinces = trip.getTripSections().stream()
                .flatMap(section -> section.getTripDetails().stream())
                .map(detail -> detail.getLocation())
                .map(location-> location.getProvince())
                .collect(Collectors.toSet());

        for(Province province : provinces) {
            user.addVisitedProvince(province);
        }

        userRepository.save(user);
    }

    public TripResponse getFullTrip(Long tripId) {
        Trip tripEntity = tripRepository.findTripCoreById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<Location> locationsToFetch = tripEntity.getTripSections().stream()
                .flatMap(sections->sections.getTripDetails().stream())
                .map(details -> details.getLocation())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        // Ko Empty
        if(!locationsToFetch.isEmpty()) {
            locationRepository.fetchLocationImages(locationsToFetch);
            locationRepository.fetchLocationCategories(locationsToFetch);
        }

        return tripMapper.toTripResponse(tripEntity);
    }

    // Hàm Update Progress
    @Transactional
    public void updateTripProgress(ProgressUpdateDTO progressUpdateDTO) {
        Trip trip = tripRepository.findById(progressUpdateDTO.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setCurrentTripSectionId(progressUpdateDTO.getCurrentTripSectionId());

        trip.setCurrentTripDetailId(progressUpdateDTO.getCurrentTripDetailId());
    }

    // Helper Function
}
