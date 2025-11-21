package com.exproject.backend.trip;

import com.exproject.backend.categorySyncStat.CategorySyncStatService;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.LocationCategoryRepository;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.trip.dto.ProgressUpdateDTO;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.info.TripStatus;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_history.TripHistoryService;
import com.exproject.backend.trip_history.dto.TripHistoryRequest;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.TripSectionRepository;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    private final TripSectionRepository tripSectionRepository;

    private final TripHistoryService tripHistoryService;

    private final LocationCategoryRepository locationCategoryRepository;

    // * Tạo Full Trip
    public void createFullTrip(TripRequest tripRequest) {
        User user = userRepository.findById(tripRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip newTrip = new Trip(tripRequest,user);

        // Loop qua Trip Section Request
        for (TripSectionRequest tripSectionRequest : tripRequest.getTripSections()) {

            TripSection newSection = new TripSection(tripSectionRequest);

            // Loop qua Trip Detail Request
            for(TripDetailRequest tripDetailRequest : tripSectionRequest.getTripDetails()) {

                // Lấy locaiton DTO ra
                LocationDTO locationDTO = tripDetailRequest.getLocation();

                // Lấy location
                Location location = locationRepository.findById(locationDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Location not found"));

                // Logic: User chọn địa điểm này -> Hệ thống hiểu User đang quan tâm Tỉnh/Loại này
                categorySyncStatService.increaseCategorySyncStat(location);


                // Loop qua location img
                for(LocationImgDTO imgDTO: locationDTO.getImgs()) {
                    // Them img mới
                    LocationImg newImg = new LocationImg(imgDTO);

                    // Add quan hệ 2 chiều vào
                    location.addLocationImg(newImg);
                }


                // Loop qua location categories
                for(LocationCategoryDTO categoryDTO: locationDTO.getCategories()) {
                    // Tìm category ể set quan hệ 2 chiều
                    LocationCategory existCategory = locationCategoryRepository
                            .findById(categoryDTO.getId())
                                    .orElseThrow(()-> new RuntimeException("Cateogry not Found"));

                    location.addLocationCategory(existCategory);
                }


                TripDetail newTripDetail = new TripDetail(tripDetailRequest,location);

                newSection.addTripDetail(newTripDetail);
            }

            newTrip.addTripSection(newSection);

        }

        Trip savedTrip = tripRepository.save(newTrip);
    }

    // Khi Trip đã hoàn thành
    public void completeTrip(Long tripId) {
        List<Trip> trips = tripRepository.findTripWithSections(tripId);

        if(trips.isEmpty()) {
            throw new RuntimeException("Trip not found");
        }

        Trip trip = trips.getFirst();

        List<TripSection> sectionsToFetch = trip.getTripSections();

        if(sectionsToFetch != null && !sectionsToFetch.isEmpty()) {
            tripSectionRepository.fetchDetailsForSections(sectionsToFetch);
        }

        // Handle đã Completed
        if(trip.getStatus() == TripStatus.COMPLETED) {
            throw new RuntimeException("Trip is already completed");
        }

        // Set Trip là hoàn thành
        trip.setStatus(TripStatus.COMPLETED);

        // Lấy User
        User user = trip.getUser();

        // Tạo Trip History Request để pass vào createTripHistory
        TripHistoryRequest tripHistoryRequest = new TripHistoryRequest();
        tripHistoryRequest.setUserId(user.getId());
        tripHistoryRequest.setTripId(trip.getId());

        // Gọi hàm tao trip HIstory
        tripHistoryService.createTripHistory(tripHistoryRequest);

        // Tìm các tỉnh mà User đã đi trong Trip này
        Set<Province> provinces = trip.getTripSections().stream()
                .flatMap(section -> section.getTripDetails().stream())
                .map(TripDetail::getLocation)
                .map(Location::getProvince)
                .collect(Collectors.toSet());

        // Update Province(tỉnh) mà User đã đi dựa trên Location
        for(Province province : provinces) {
            user.addVisitedProvince(province);
        }

        userRepository.save(user);
    }

    // Lấy Full Trip
    @Cacheable(value = "full_trip", key = "#tripId")
    public TripResponse getFullTrip(Long tripId) {

        List<Trip> trips = tripRepository.findTripWithSections(tripId);

        if(trips.isEmpty()) {
            throw new RuntimeException("Trip not found");
        }

        Trip tripEntity = trips.getFirst();

        List<TripSection> sectionsToFetch = tripEntity.getTripSections();

        if(sectionsToFetch != null && !sectionsToFetch.isEmpty()) {
            tripSectionRepository.fetchDetailsForSections(sectionsToFetch);
        }
        else {
            throw new RuntimeException("Trip Section not found");
        }

        List<Location> locationsToFetch = tripEntity.getTripSections().stream()
                .flatMap(sections->sections.getTripDetails().stream())
                .map(TripDetail::getLocation)
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
