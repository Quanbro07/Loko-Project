package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationDTO;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    private final LocationMapper locationMapper;

    private final Integer FRESH_TIME = 30;

    // Lấy Top Location dựa trên Province và thể loại
    @Cacheable(value = "top_locations_dto", key = "#provinceId + '_' + #categoryId")
    public List<LocationDTO> getTopLocations(Long provinceId, Long categoryId) {

        LocalDateTime minDate = LocalDateTime.now().minusMinutes(FRESH_TIME);

        // Top 20
        Pageable limits = PageRequest.of(0, 20);

        List<Location> locationList = locationRepository
                .findTopLocations(provinceId,categoryId, minDate, limits);

        List<LocationDTO> locationDTOList = locationList.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());

        return locationDTOList;
    }

    // Hàm hỗ trợ Scheduler xóa cache sau khi update DB
    @CacheEvict(value = "top_locations", key = "#provinceId + '_' + #categoryId")
    public void clearLocationCache(Long provinceId, Long categoryId) {
        System.out.println("Đã xóa cache Redis cho: " + provinceId + " - " + categoryId);
    }
}
