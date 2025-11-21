package com.exproject.backend.makePlan;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.hobby.info.EHobby;
import com.exproject.backend.hobby.info.HobbyCategoryMapping;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationMapper;
import com.exproject.backend.location.LocationService;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.makePlan.dto.MakePlanRequest;
import com.exproject.backend.province.info.EProvince;
import com.exproject.backend.trip.TripService;
import com.exproject.backend.trip.dto.TripRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MakePlanService {

    private final LocationService locationService;
    private final LocationMapper locationMapper;
    private final AIAPIService aiapiService;
    private final TripService tripService;

    public void makePlan(MakePlanRequest request) {

        // 1. Map hobby -> list category
        EHobby hobby = request.getHobby();
        if (hobby == null) {
            throw new RuntimeException("Hobby must not be null");
        }

        List<ELocationCategory> categories =
                HobbyCategoryMapping.getCategories(hobby);

        if (categories.isEmpty()) {
            throw new RuntimeException("No category mapping for hobby: " + hobby);
        }

        // 2. Lấy provinceId & categoryId
        EProvince provinceEnum = request.getProvince();
        if (provinceEnum == null) {
            throw new RuntimeException("Province must not be null");
        }

        Long provinceId = (long) (provinceEnum.ordinal() + 1);

        List<Location> collected = new ArrayList<>();

        for (ELocationCategory cate : categories) {
            Long categoryId = (long) (cate.ordinal() + 1);

            // dùng hàm getTopLocations trong LocationService như bạn nói
            List<Location> topLocations = locationService.getTopLocations(provinceId, categoryId);

            collected.addAll(topLocations);
        }

        if (collected.isEmpty()) {
            throw new RuntimeException("Không tìm thấy location phù hợp cho hobby: " + hobby);
        }

        // 3. Map Location -> LocationDTO để gửi cho AI
        List<LocationDTO> locationDTOS = collected.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());

        // set lại vào request để gửi sang AI
        request.setLocationCategories(categories);
        request.setLocaitons(locationDTOS);

        // 4. Gọi AI server -> TripRequest
        TripRequest tripRequest = aiapiService.generateTripPlan(request);

        if (tripRequest == null) {
            throw new RuntimeException("AI service returned null TripRequest");
        }

        // 5. Tạo Trip trong DB
        tripService.createFullTrip(tripRequest);
    }
}
