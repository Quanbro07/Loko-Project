package com.exproject.backend.categorySyncStat;

import com.exproject.backend.categorySyncStat.dto.CategorySyncStatDTO;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/category-sync")
public class CategorySyncStatController {

    private final CategorySyncStatService categorySyncStatService;

    @PostMapping("/get-location")
    public ResponseEntity<Void> getLocation(
            @RequestBody CategorySyncStatDTO request) {

        categorySyncStatService.getLocation(request);

        return ResponseEntity.noContent().build();
    }
}
