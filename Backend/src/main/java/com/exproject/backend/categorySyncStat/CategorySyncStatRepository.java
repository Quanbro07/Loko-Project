package com.exproject.backend.categorySyncStat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategorySyncStatRepository extends CrudRepository<CategorySyncStat, Long> {
    Optional<CategorySyncStat> findByProvinceIdAndLocationCategoryId(Long provinceId, Long categoryId);

    /**
     * Tìm task thông minh theo 2 ngưỡng:
     * - Nhóm Hot: usageCount >= :hotThreshold VÀ cũ hơn :hotDate
     * - Nhóm Cold: usageCount < :hotThreshold VÀ cũ hơn :coldDate
     */
    @Query("SELECT s from CategorySyncStat s " +
            "WHERE " +
            " (s.usageCount >= :hotUsageThreshold AND s.lastSyncedAt < :hotDateThreshold) " +
            "OR " +
            " (s.usageCount < :hotUsageThreshold AND s.lastSyncedAt < :coldDateThreshold)" +
            "ORDER BY s.usageCount DESC"
    )
    List<CategorySyncStat> findSmartTasksToSync(
            @Param("hotUsageThreshold") Integer hotUsageThreshHold,
            @Param("hotDateThreshold") LocalDateTime hotDateThreshold,
            @Param("coldDateThreshold") LocalDateTime coldDateThreshold,
            Pageable pageable);
}
