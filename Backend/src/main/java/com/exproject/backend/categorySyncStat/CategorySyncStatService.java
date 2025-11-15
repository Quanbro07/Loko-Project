package com.exproject.backend.categorySyncStat;

import com.exproject.backend.categorySyncStat.dto.CategorySyncStatDTO;
import com.exproject.backend.location.Location;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.province.info.Province;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategorySyncStatService {

    private final CategorySyncStatRepository categorySyncStatRepository;

    // Tăng usage Category Sunc Stat
    public void increaseCategorySyncStat(Location location) {
        Province province = location.getProvince();

        List<LocationCategory> categories = location.getLocationCategories();

        for (LocationCategory category : categories) {
            // 1. Tìm xem đã có record thống kê chưa
            CategorySyncStat stat = categorySyncStatRepository
                    .findByProvinceIdAndLocationCategoryId(province.getId(), category.getId())
                    .orElse(null);

            if (stat == null) {
                // 2. Nếu chưa có -> Tạo mới
                stat = CategorySyncStat.builder()
                        .province(province)
                        .locationCategory(category)
                        .usageCount(1) // Khởi tạo là 1
                        .lastSyncedAt(LocalDateTime.now().minusMonths(1)) // Set cũ để ưu tiên sync sớm
                        .build();
            } else {
                // 3. Nếu có rồi -> Tăng count
                stat.setUsageCount(stat.getUsageCount() + 1);
            }

            // 4. Lưu lại
            categorySyncStatRepository.save(stat);
        }
    }

    // Tìm các Province - Category để gọi API làm mới location
    @Transactional
    public List<CategorySyncStatDTO> getCategorySyncStatForAPICall(int quotaLimit) {
        LocalDateTime now = LocalDateTime.now();

        // Ngưỡng cho bọn HOT: Cũ hơn 1 tháng là phải update lại
        LocalDateTime hotDateThreshold = now.minusMonths(1);

        // Ngưỡng cho bọn COLD: Cũ hơn 3 tháng mới thèm update
        LocalDateTime coldDateThreshold = now.minusMonths(3);

        // 2. CẤU HÌNH NGƯỠNG ĐỘ HOT (Bạn có thể lưu vào file properties)
        // Ví dụ: Được dùng trên 10 lần là coi như Hot (cần chăm sóc kỹ hơn)
        int hotUsageThreshold = 10;

        Pageable limit = PageRequest.of(0, quotaLimit);

        List<CategorySyncStat> tasks = categorySyncStatRepository.findSmartTasksToSync(
                hotUsageThreshold,
                hotDateThreshold,
                coldDateThreshold,
                limit
        );

        List<CategorySyncStatDTO> tasksDTO = tasks.stream()
                .map(this::convertToCategorySyncStatDTO)
                .collect(Collectors.toList());

        return tasksDTO;
    }

    private CategorySyncStatDTO convertToCategorySyncStatDTO(CategorySyncStat stat) {
        return CategorySyncStatDTO.builder()
                .provinceName(stat.getProvince().getProvinceName())
                .locationCategoryName(stat.getLocationCategory().getLocationCategoryName())
                .usageCount(stat.getUsageCount())
                .lastSyncedAt(stat.getLastSyncedAt())
                .build();
    }
}
