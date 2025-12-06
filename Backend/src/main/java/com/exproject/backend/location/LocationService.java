package com.exproject.backend.location;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location.dto.LocationIdDTO;
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

        LocalDateTime minDate = LocalDateTime.now().minusDays(  FRESH_TIME);

        Pageable limits = PageRequest.of(0, Top_N);

        List<Location> locationList = locationRepository
                .findTopLocations(provinceId,categoryId, minDate, limits);

        return locationList.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());
    }

    // Tìm điểm thay thế
    public List<LocationDTO> getTopReplacementLocations(
            List<LocationDTO> sourceLocations,
            Set<Long> rejectedCategoryIds, // Đổi tên cho rõ nghĩa
            LocalTime rejectedOpenTime,    // Đổi tên cho rõ nghĩa
            LocalTime rejectedCloseTime,
            Set<Long> excludedLocationIds)
    {

        // 1. Pre-calculate: Nếu cần thiết thì nên có map check nhanh, nhưng với số lượng nhỏ thì stream ok.
        // Tuy nhiên, logic containsAll nên đổi thành match score hoặc anyMatch.

        return sourceLocations.stream()
                // 1. Lọc ID trùng
                .filter(dto -> !excludedLocationIds.contains(dto.getId()))

                // 2. Check Time (Nới lỏng: Chỉ cần giao thoa thời gian hoạt động, hoặc check null an toàn)
                .filter(dto -> {
                    // Nếu data cũ không có giờ, hoặc data mới không có giờ -> Bỏ qua check (cho phép đi)
                    if (rejectedOpenTime == null || rejectedCloseTime == null
                            || dto.getOpenTime() == null || dto.getCloseTime() == null) {
                        return true;
                    }
                    // Logic cũ: Bao trùm (Strict) - Giữ nguyên nếu bạn thực sự muốn vậy
                    // Nhưng nên handle null để tránh NullPointerException
                    return !dto.getOpenTime().isAfter(rejectedOpenTime)
                            && !dto.getCloseTime().isBefore(rejectedCloseTime);
                })

                // 3. Check Category (RELAXED - Quan trọng)
                .filter(dto -> {
                    if (rejectedCategoryIds.isEmpty()) return true;

                    // Lấy list ID của candidate
                    Set<Long> dtoCatIds = dto.getCategories().stream()
                            .map(LocationCategoryDTO::getId)
                            .collect(Collectors.toSet());

                    // CÁCH 1: Chỉ cần trùng ít nhất 1 category (Khuyên dùng)
                    boolean matchAny = dtoCatIds.stream().anyMatch(rejectedCategoryIds::contains);
                    return matchAny;

                    // CÁCH 2: (Nâng cao) Logic cũ quá chặt -> Code sẽ trả về Rỗng.
                    // return dtoCatIds.containsAll(rejectedCategoryIds);
                })

                // 4. Sort (Thông minh hơn: Ưu tiên Category trùng nhiều nhất -> rồi mới đến Rating)
                .sorted((d1, d2) -> {
                    // Tính điểm category match (Optional)
                    // Nếu không cần thì giữ nguyên sort rating như cũ

                    double r1 = d1.getAverageRating() != null ? d1.getAverageRating() : 0.0;
                    double r2 = d2.getAverageRating() != null ? d2.getAverageRating() : 0.0;
                    return Double.compare(r2, r1);
                })
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

    public List<LocationIdDTO> getVisitedLocations(Long userId) {
        List<Location> visitedLocations = locationRepository.findAllVisitedLocations(userId);

        return visitedLocations.stream()
                .map(this::convertToLocationIdDTO)
                .toList();
    }

    // Hàm hỗ trợ Scheduler xóa cache sau khi update DB
    @CacheEvict(value = "top_locations", key = "#provinceId + '_' + #categoryId")
    public void clearLocationCache(Long provinceId, Long categoryId) {
        System.out.println("Đã xóa cache Redis cho: " + provinceId + " - " + categoryId);
    }

    public LocationIdDTO convertToLocationIdDTO(Location location) {
        return LocationIdDTO.builder()
                .locationId(location.getId())
                .ggPlaceId(location.getGgPlaceId())
                .build();
    }

}
