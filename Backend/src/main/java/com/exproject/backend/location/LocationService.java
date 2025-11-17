package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    private final Integer FRESH_TIME = 30;

    // Lấy tất cả Location từ province_Name
    public List<LocationResponse> getLocations(String provinceName) {
        List<Location> locationsList = locationRepository.findAllByProvince_ProvinceName(provinceName);

        List<LocationResponse> locationResponseList = new ArrayList<>();

        for (Location location : locationsList) {
            LocationResponse locationResponse = new LocationResponse(location);

            locationResponseList.add(locationResponse);
        }

        return locationResponseList;
    }

    // Lấy Top Location dựa trên Province và thể loại
    @Cacheable(value = "top_locations", key = "#provinceId + '_' + #categoryId")
    public List<Location> getTopLocations(Long provinceId,Long categoryId) {

        LocalDateTime minDate = LocalDateTime.now().minusMinutes(FRESH_TIME);

        Pageable limits = PageRequest.of(0, 20);

        List<Location> locationList = locationRepository
                .findTopLocations(provinceId,categoryId, minDate, limits);

        return locationList;
    }

    // Hàm hỗ trợ Scheduler xóa cache sau khi update DB
    @CacheEvict(value = "top_locations", key = "#provinceId + '_' + #categoryId")
    public void clearLocationCache(Long provinceId, Long categoryId) {
        System.out.println("Đã xóa cache Redis cho: " + provinceId + " - " + categoryId);
    }
}
