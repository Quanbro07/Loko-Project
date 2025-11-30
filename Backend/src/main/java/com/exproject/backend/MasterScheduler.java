package com.exproject.backend;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.categorySyncStat.CategorySyncStatService;
import com.exproject.backend.categorySyncStat.dto.CategorySyncStatDTO;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.LocationService;
import com.exproject.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MasterScheduler {
    private final AIAPIService aiAPIService;

    private final CategorySyncStatService categorySyncStatService;

    private final LocationRepository locationRepository;

    private final LocationService locationService;

    private final UserService userService;

    // *Còn đang test
    // @Scheduled(cron = "")
    public void runSchedule() {
        LocalDate today = LocalDate.now();

        runGetLocationsSchedule(today);
    }

    // Giây | Phút | Giờ | Ngày trong tháng | Tháng | Thứ trong tuần
    @Scheduled(cron = "0 0 1 * * ?")
    public void runDailySchedule() {
        userService.downgradeUserSchedule();
    }

    @Scheduled(cron = "0 0 0 1 */3 ?")
    public void runQuarterlySchedule() {
        runGetLocationsSchedule(LocalDate.now());
    }

    public void runGetLocationsSchedule(LocalDate date) {
        System.out.println("[MASTER JOB START] " + date);

        // Lấy các tinh + category chuẩn bị cho api call lấy location
        List<CategorySyncStatDTO> tasksToSync = categorySyncStatService.getCategorySyncStatForAPICall(5);

        if (tasksToSync.isEmpty()) {
            System.out.println("[MASTER JOB END] Không có task nào cần đồng bộ.");
            return;
        }

        System.out.println("[MASTER JOB] Sẽ đồng bộ " + tasksToSync.size() + " task.");

        // Gọi API lấy locations
        List<Location> locations = aiAPIService.getLocations(tasksToSync);

        // Insert địa điểm mới
        // Địa điểm cũ thì bõ qua
        for(Location location : locations) {
            try {
                locationRepository.save(location);
            }
            catch (DataIntegrityViolationException e) {
                // Trung gg_place_id
                // Bỏ qua
                System.out.println("Bỏ qua location đã tồn tại: " + location.getGgPlaceId());
            }
        }

        // Update Last Synced
        categorySyncStatService.updateLastSyncedAt(tasksToSync);
        System.out.println("[MASTER JOB] Đã cập nhật lastSyncedAt.");

        // Xóa cache
        for (CategorySyncStatDTO task : tasksToSync) {
            locationService.clearLocationCache(task.getProvinceId(), task.getLocationCategoryId());
        }
        System.out.println("[MASTER JOB] Đã xóa cache Redis cho các task vừa đồng bộ.");

        System.out.println("[MASTER JOB END] " + date);
    }


}
