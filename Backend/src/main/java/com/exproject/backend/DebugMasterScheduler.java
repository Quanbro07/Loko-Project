package com.exproject.backend;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/debug")
@RequiredArgsConstructor
public class DebugMasterScheduler {
    private final MasterScheduler masterScheduler;

    @GetMapping("/run-master-job")
    public String runMasterJobManually() {
        try {
            System.out.println("--- [DEBUG] Kích hoạt MasterScheduler bằng tay ---");
            masterScheduler.runSchedule(); // <-- Gọi thẳng hàm @Scheduled
            System.out.println("--- [DEBUG] MasterScheduler đã chạy xong ---");
            return "OK: MasterScheduler đã chạy xong. Kiểm tra log của Java và Python.";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }
}
