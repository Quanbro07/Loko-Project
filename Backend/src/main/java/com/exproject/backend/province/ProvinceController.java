package com.exproject.backend.province;

import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.province.dto.ProvinceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/province")
public class ProvinceController {

    private final ProvinceService provinceService;

    @PreAuthorize("authentication.principal.id == #userId")
    @GetMapping("/getAll")
    public ResponseEntity<List<ProvinceDTO>> getVisitedProvinces(
            @RequestParam Long userId) {

        List<ProvinceDTO> response = provinceService.getAllProvince(userId);

        return ResponseEntity.ok(response);
    }


}
