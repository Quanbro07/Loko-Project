package com.exproject.backend.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
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
            open_time, avg_visit_time, ticket_price, average_rating, review_count, update_at
        )
        VALUES (
            :#{#loc.ggPlaceId}, :#{#loc.province.id}, :#{#loc.locationName}, :#{#loc.latitude}, :#{#loc.longitude},
            :#{#loc.openTime}, :#{#loc.avgVisitTime}, :#{#loc.ticketPrice}, :#{#loc.averageRating}, :#{#loc.reviewCount}, :#{#loc.updateAt}
        )
        ON CONFLICT (gg_place_id) DO NOTHING
    """, nativeQuery = true)
    void insertIgnoreDuplicates(@Param("loc") Location location);

    // Query 2: Lấy Imgs
    @Query("SELECT DISTINCT loc FROM Location loc " +
            "LEFT JOIN FETCH loc.locationImgs " +
            "WHERE loc IN :locations")
    void fetchLocationImages(@Param("locations") List<Location> locations);

    // Query 3: Lấy Categories
    @Query("SELECT DISTINCT loc FROM Location loc " +
            "LEFT JOIN FETCH loc.locationCategories " +
            "WHERE loc IN :locations")
    void fetchLocationCategories(@Param("locations") List<Location> locations);

}
