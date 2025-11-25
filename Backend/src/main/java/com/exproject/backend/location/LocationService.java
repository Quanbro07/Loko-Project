package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.utils.GeoUtils;
import com.exproject.backend.wrapper.CandidateScore;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    private final LocationMapper locationMapper;

    private final Integer FRESH_TIME = 60;

    // Top 20
    private final Integer Top_N = 20;

    private static final double RATING_WEIGHT_FACTOR = 5.0;

    // Lấy Top Location dựa trên Province và thể loại
    @Cacheable(value = "top_locations_dto", key = "#provinceId + '_' + #categoryId")
    public List<LocationDTO> getTopLocations(Long provinceId, Long categoryId) {

        LocalDateTime minDate = LocalDateTime.now().minusMinutes(FRESH_TIME);

        Pageable limits = PageRequest.of(0, Top_N);

        List<Location> locationList = locationRepository
                .findTopLocations(provinceId,categoryId, minDate, limits);

        return locationList.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());
    }

    // Tìm điểm thay thế
    public List<LocationDTO> getTopReplacementLocations(
            List<LocationDTO> sourceLocations, Set<Long> categoryIds,
            LocalTime openTime, LocalTime closeTime,
            Set<Long> excludedLocationIds) {


        return sourceLocations.stream()
                // 1. Lọc ID trùng
                .filter(dto -> !excludedLocationIds.contains(dto.getId()))

                // 2. Check time (Lấy từ DTO)
                .filter(dto -> {
                    LocalTime o = dto.getOpenTime();
                    LocalTime c = dto.getCloseTime();
                    return o != null && c != null && !o.isAfter(openTime) && !c.isBefore(closeTime);
                })

                // 3. Check Category Strict (Lấy từ DTO)
                .filter(dto -> {
                    if (categoryIds.isEmpty()) return true;

                    // Mapper của bạn chắc chắn đã map List<LocationCategory> sang List<LocationCategoryDTO>
                    Set<Long> dtoCatIds = dto.getCategories().stream()
                            .map(LocationCategoryDTO::getId)
                            .collect(Collectors.toSet());

                    return dtoCatIds.containsAll(categoryIds);
                })

                // 4. Sort (Lấy từ DTO)
                .sorted((d1, d2) -> {
                    double r1 = d1.getAverageRating() != null ? d1.getAverageRating() : 0.0;
                    double r2 = d2.getAverageRating() != null ? d2.getAverageRating() : 0.0;
                    return Double.compare(r2, r1);
                })
                // Collect
                .collect(Collectors.toList());
    }

    // Tìm điểm thay the tot nhất dựa vào khoảng cách
    public LocationDTO getBestReplacementLocations(LocationDTO start,
           List<LocationDTO> candidates,LocationDTO end) {
        if(candidates == null || candidates.isEmpty()) {
            return null;
        }

        PriorityQueue<CandidateScore> pq = new PriorityQueue<>(
                Comparator.comparingDouble(CandidateScore::getScore)
        );

        for(LocationDTO candidate : candidates) {
            double distFromStart = 0.0;
            double distToEnd = 0.0;

            if(start != null) {
                distFromStart = GeoUtils.calculateDistance(
                        start.getLatitude(),start.getLongitude(),
                        candidate.getLatitude(), candidate.getLongitude()
                );
            }

            if(end != null) {
                distToEnd = GeoUtils.calculateDistance(
                        end.getLatitude(),end.getLongitude(),
                        candidate.getLatitude(), candidate.getLongitude()
                );
            }

            double totalDistance = distFromStart + distToEnd;

            double currentRate = candidate.getAverageRating();

            double ratingGap = 5.0 - currentRate;

            // Ý nghĩa: "1 điểm Rating (Sao) tương đương với 5km di chuyển"
            double totalScore = totalDistance + ratingGap * RATING_WEIGHT_FACTOR;

            pq.add(new CandidateScore(candidate, totalScore));
        }

        CandidateScore best = pq.poll();

        return best != null ? best.getLocation() : null;
    }


    // Hàm hỗ trợ Scheduler xóa cache sau khi update DB
    @CacheEvict(value = "top_locations", key = "#provinceId + '_' + #categoryId")
    public void clearLocationCache(Long provinceId, Long categoryId) {
        System.out.println("Đã xóa cache Redis cho: " + provinceId + " - " + categoryId);
    }
}
