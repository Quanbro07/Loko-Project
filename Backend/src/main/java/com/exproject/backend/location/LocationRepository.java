package com.exproject.backend.location;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByProvince_Id(Long provinceId);

    List<Location> findAllByProvince_ProvinceName(String ProvinceName);

    Optional<Location> findById(long id);

    @Query("SELECT l from Location l " + // lấy location
            "JOIN l.locationCategories c " + // Join với bảng locationCateogry
            "WHERE l.province.id = :provinceId " +
            "AND c.id = :categoryId " + // Điều kiện cùng thể loại
            "AND l.updateAt >= :minDate " + // ngày update > minDate: Lọc độ tươi mới
            "ORDER BY l.averageRating DESC, l.reviewCount DESC" // Sort theo rating
    )
    List<Location> findTopLocations(@Param("provinceId") Long provinceId,
                                    @Param("categoryId") Long locationCategoryId,
                                    @Param("minDate") LocalDateTime minDate,
                                    Pageable pageable);

    @Transactional
    @Modifying
    @Query(value = """
        INSERT INTO location (
            gg_place_id, province_id, location_name, latitude, longitude, 
            open_time, close_time, avg_visit_time, ticket_price, average_rating, review_count, update_at
        )
        VALUES (
            :#{#loc.ggPlaceId}, :#{#loc.province.id}, :#{#loc.locationName}, :#{#loc.latitude}, :#{#loc.longitude},
            :#{#loc.openTime}, :#{#loc.avgVisitTime}, :#{#loc.ticketPrice}, :#{#loc.averageRating}, :#{#loc.reviewCount}, 
            :#{#loc.updateAt}, :#{#loc.closeTime}
        )
        ON CONFLICT (gg_place_id) DO NOTHING
    """, nativeQuery = true)
    void insertIgnoreDuplicates(@Param("loc") Location location);

    // Query 2: Lấy Imgs
    @Query("SELECT DISTINCT loc FROM Location loc " +
            "LEFT JOIN FETCH loc.locationImgs " +
            "WHERE loc IN :locations")
    List<Location> fetchLocationImages(@Param("locations") List<Location> locations);

    // Query 3: Lấy Categories
    @Query("SELECT DISTINCT loc FROM Location loc " +
            "LEFT JOIN FETCH loc.locationCategories " +
            "WHERE loc IN :locations")
    List<Location> fetchLocationCategories(@Param("locations") List<Location> locations);

    List<Location> findAllByIdIn(List<Long> ids);

    @Query("SELECT DISTINCT l from Location l " +
            "JOIN l.locationCategories c " +
            "WHERE l.province.id = :provinceId " +
            "AND c.id IN :categoryIds  " +
            "AND l.updateAt >= :minDate " +
            // Logic thời gian: Mở trước giờ đến và đóng sau giờ đi
            "AND l.openTime <= :requiredStartTime " +
            "AND l.closeTime >= :requiredEndTime " +

            // Tránh các địa điểm đã reject hoặc đã có trong plan
            "AND l.id NOT IN :excludedLocationIds " +

            "ORDER BY l.averageRating DESC, l.reviewCount DESC"
    )
    List<Location> findReplacementLocations(
            @Param("provinceId") Long provinceId,
            @Param("provinceId") List<Long> categoryIds,
            @Param("minDate") LocalDateTime minDate,
            @Param("requiredStartTime") LocalTime requiredStartTime,
            @Param("requiredEndTime") LocalTime requiredEndTime,
            @Param("excludedLocationIds") List<Long> excludedLocationIds,
            Pageable pageable
            );

    @Query("SELECT l FROM Location l JOIN FETCH l.locationCategories WHERE l.province.id = :provinceId")
    List<Location> findAllByProvince(@Param("provinceId") Long provinceId);

    @Query("SELECT DISTINCT td.location FROM TripDetail td " +
            "JOIN td.tripSection ts " +
            "JOIN ts.trip t " +
            "WHERE t.user.id = :userId")
    List<Location> findAllVisitedLocations(@Param("userId") Long userId);
}
