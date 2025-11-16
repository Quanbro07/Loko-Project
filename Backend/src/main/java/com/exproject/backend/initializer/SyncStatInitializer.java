package com.exproject.backend.initializer;

import com.exproject.backend.categorySyncStat.CategorySyncStat;
import com.exproject.backend.categorySyncStat.CategorySyncStatRepository;
import com.exproject.backend.location_category.LocationCategoryRepository;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.Province;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Order(3) // <-- QUAN TRỌNG: Chạy cuối cùng
public class SyncStatInitializer implements CommandLineRunner {

    private final ProvinceRepository provinceRepository;

    private final LocationCategoryRepository locationCategoryRepository;

    private final CategorySyncStatRepository categorySyncStatRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Nếu đã có dữ liệu rồi thì không chạy nữa
        if (categorySyncStatRepository.count() > 0) {
            return;
        }

        System.out.println("[Initializer] Bắt đầu mồi dữ liệu cho CategorySyncStat...");

        // 2. Lấy tất cả province và category (chắc chắn đã có do @Order(1) và @Order(2))
        List<Province> allProvinces = provinceRepository.findAll();
        List<LocationCategory> allCategories = locationCategoryRepository.findAll();

        List<CategorySyncStat> statsToSave = new ArrayList<>();

        // 3. Dùng 2 vòng lặp lồng nhau để tạo "task" cho mọi sự kết hợp
        for (Province province : allProvinces) {
            for (LocationCategory category : allCategories) {

                CategorySyncStat stat = CategorySyncStat.builder()
                        .province(province)
                        .locationCategory(category)
                        .usageCount(0) // Mới tạo, chưa ai dùng
                        // Set một ngày RẤT CŨ để scheduler ưu tiên chạy ngay
                        .lastSyncedAt(LocalDateTime.now().minusYears(1))
                        .build();

                statsToSave.add(stat);
            }
        }

        // 4. Lưu tất cả vào CSDL trong 1 lần (hiệu năng cao)
        categorySyncStatRepository.saveAll(statsToSave);
        System.out.println("[Initializer] Đã mồi " + statsToSave.size() + " task cho CategorySyncStat.");
    }
}