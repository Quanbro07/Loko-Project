package com.exproject.backend.makePlan;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.aiAPI.dto.RawLocationImgDTO;
import com.exproject.backend.aiAPI.dto.MakePlanPythonPayload;
import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.hobby.info.HobbyCategoryMapping;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationMapper;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.makePlan.dto.MakePlanRequest;
import com.exproject.backend.trip.TripService;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip.info.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;


import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MakePlanService {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;
    private final AIAPIService aiapiService;
    private final TripService tripService;

    public TripResponse makePlan(MakePlanRequest request) {

        // 1. Map hobby → list category
        List<ELocationCategory> categories =
                HobbyCategoryMapping.getCategories(request.getHobby());

        // 2. Province + category → get locations từ DB
        List<LocationDTO> locationDTOS = getLocationsFromDB(request, categories);

        if (locationDTOS.isEmpty()) {
            throw new RuntimeException("Không tìm thấy location phù hợp hobby!");
        }

        // 3. Convert → RawLocationDTO
        List<RawLocationDTO> rawLocations = locationDTOS.stream()
                .map(this::convertToRaw)
                .collect(Collectors.toList());

        // 4. Gửi sang AI → nhận TripRequest
        TripRequest tripRequest = aiapiService.generateTripPlan(request, rawLocations);

        // 5. Lưu trip vào DB
        Trip savedTrip = tripService.createFullTrip(tripRequest);

        // 6. Trả trip response chuẩn
        return tripService.getFullTrip(savedTrip.getId());
    }

    private List<LocationDTO> getLocationsFromDB(MakePlanRequest request, List<ELocationCategory> categories) {

        List<Location> collected = new ArrayList<>();

        for (ELocationCategory cate : categories) {
            collected.addAll(
                    locationRepository.findTopLocations(
                            (long) (request.getProvince().ordinal() + 1),
                            (long) (cate.ordinal() + 1),
                            LocalDateTime.now().minusMonths(3),
                            PageRequest.of(0, 10)
                    )
            );

        }

        return collected.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());
    }

    private RawLocationDTO convertToRaw(LocationDTO dto) {
        return RawLocationDTO.builder()
                .ggPlaceId(dto.getGgPlaceId())
                .locationName(dto.getLocationName())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .openTime(dto.getOpenTime())
                .avgVisitTime(dto.getAvgVisitTime())
                .ticketPrice(dto.getTicketPrice())
                .averageRating(dto.getAverageRating())
                .reviewCount(dto.getReviewCount())
                .provinceId(dto.getProvinceId())
                .categoryIds(dto.getCategories().stream()
                        .map(c -> c.getId())
                        .collect(Collectors.toList()))
                .rawImgs(dto.getImgs().stream()
                        .map(img -> new RawLocationImgDTO(
                                img.getImg_url(),
                                img.getDescription()
                        ))
                        .collect(Collectors.toList()))
                .build();
    }

}
