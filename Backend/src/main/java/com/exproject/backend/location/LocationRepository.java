package com.exproject.backend.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


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
}
