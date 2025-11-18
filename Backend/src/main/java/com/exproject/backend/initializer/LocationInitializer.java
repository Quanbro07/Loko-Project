package com.exproject.backend.initializer;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location_category.LocationCategoryRepository;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.EProvince;
import com.exproject.backend.province.info.Province;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Order(2)
@Component
@RequiredArgsConstructor
public class LocationInitializer implements CommandLineRunner {

    private final LocationRepository locationRepository;

    private final ProvinceRepository provinceRepository;

    private final LocationCategoryRepository locationCategoryRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        boolean isTest = true;

        if(locationRepository.count() > 0) {
            return;
        }

        if(!isTest) {
            return;
        }

        System.out.println("🚀 ĐANG TẠO MOCK DATA CHO LOCATION...");

        // 1. LẤY DỮ LIỆU MẪU ĐỂ TEST (Giả sử lấy Hà Nội và Cafe làm chuẩn)
        Province targetProvince = provinceRepository.findByProvinceName(EProvince.HaNoi.name())
                .orElseThrow(() -> new RuntimeException("Chưa init Province Hà Nội"));

        Province noiseProvince = provinceRepository.findByProvinceName(EProvince.TPHCM.name())
                .orElseThrow(() -> new RuntimeException("Chưa init Province HCM"));

        LocationCategory targetCategory = locationCategoryRepository.findByLocationCategoryName(ELocationCategory.CAFE.name())
                .orElseThrow(() -> new RuntimeException("Chưa init Category Coffee"));

        LocationCategory noiseCategory = locationCategoryRepository.findByLocationCategoryName(ELocationCategory.HOTEL.name())
                .orElseThrow(() -> new RuntimeException("Chưa init Category Hotel"));


        List<Location> dummyLocations = new ArrayList<>();

        // --- CASE 1: TOP 1 (Rating cao, nhiều review, mới update) ---
        dummyLocations.add(createMockLocation(
                "Highlands Hồ Gươm (TOP 1)", targetProvince, targetCategory,
                5.0, 500, LocalDateTime.now()
        ));

        // --- CASE 2: TOP 2 (Rating cao, ít review hơn, mới update) ---
        dummyLocations.add(createMockLocation(
                "The Coffee House (TOP 2)", targetProvince, targetCategory,
                5.0, 200, LocalDateTime.now()
        ));

        // --- CASE 3: TOP 3 (Rating thấp hơn xíu, mới update) ---
        dummyLocations.add(createMockLocation(
                "Cà Phê Giảng (TOP 3)", targetProvince, targetCategory,
                4.5, 1000, LocalDateTime.now().minusDays(2)
        ));

        // --- CASE 4: BỊ LOẠI - DATA CŨ (Rating cực cao nhưng update 2 tháng trước) ---
        dummyLocations.add(createMockLocation(
                "Cafe Cổ (DATA CŨ - LOẠI)", targetProvince, targetCategory,
                5.0, 9999, LocalDateTime.now().minusMonths(2)
        ));

        // --- CASE 5: BỊ LOẠI - SAI TỈNH (HCM) ---
        dummyLocations.add(createMockLocation(
                "Cafe Bitexco (SAI TỈNH - LOẠI)", noiseProvince, targetCategory,
                5.0, 100, LocalDateTime.now()
        ));

        // --- CASE 6: BỊ LOẠI - SAI THỂ LOẠI (Khách sạn) ---
        dummyLocations.add(createMockLocation(
                "Melia Hotel (SAI LOẠI - LOẠI)", targetProvince, noiseCategory,
                5.0, 100, LocalDateTime.now()
        ));

        locationRepository.saveAll(dummyLocations);
        System.out.println("✅ ĐÃ TẠO XONG " + dummyLocations.size() + " LOCATION.");

        // 2. CHẠY TEST QUERY NGAY LẬP TỨC
        performTestQuery(targetProvince.getId(), targetCategory.getId());
    }

    // Hàm Helper để tạo Location nhanh
    private Location createMockLocation(String name, Province province, LocationCategory category,
                                        Double rating, Integer reviewCount, LocalDateTime updateAt) {
        return Location.builder()
                .ggPlaceId(UUID.randomUUID().toString()) // Random String ID
                .locationName(name)
                .province(province)
                .locationCategories(Collections.singletonList(category)) // Set Category
                .averageRating(rating)
                .reviewCount(reviewCount)
                .updateAt(updateAt) // Lưu ý tên biến entity của bạn là updateAt
                // Các field bắt buộc khác fake tạm
                .latitude(21.0)
                .longitude(105.0)
                .openTime("08:00 - 22:00")
                .build();
    }

    // Hàm Test Query in kết quả ra màn hình
    private void performTestQuery(Long provinceId, Long categoryId) {
        System.out.println("\n--------------------------------------------------");
        System.out.println("🔎 TEST QUERY: Tìm Top Location tại HÀ NỘI - COFFEE");
        System.out.println("   (Điều kiện: Update trong 30 ngày gần nhất)");
        System.out.println("--------------------------------------------------");

        LocalDateTime minDate = LocalDateTime.now().minusDays(30);

        // Gọi Repository (Bạn nhớ import đúng Pageable của Spring Data)
        List<Location> results = locationRepository.findTopLocations(
                provinceId,
                categoryId,
                minDate,
                PageRequest.of(0, 10)
        );

        if (results.isEmpty()) {
            System.out.println("❌ KHÔNG TÌM THẤY KẾT QUẢ NÀO!");
        } else {
            for (Location loc : results) {
                System.out.printf("🏆 %-30s | ⭐ %.1f | 💬 %-4d reviews | 📅 %s%n",
                        loc.getLocationName(),
                        loc.getAverageRating(),
                        loc.getReviewCount(),
                        loc.getUpdateAt().toLocalDate());
            }
        }
        System.out.println("--------------------------------------------------\n");
    }

}

