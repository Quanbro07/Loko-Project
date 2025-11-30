package com.exproject.backend.aiAPI;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.location.dto.LocationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/ai-api")
@RequiredArgsConstructor
public class AIAPIController {

    private final PythonAPIConfig pythonAPIConfig;

    private final AIAPIService aiAPIService;

    @GetMapping("/test")
    public String test() {
        return pythonAPIConfig.getBaseUrl() + pythonAPIConfig.getVersionUrl() + System.lineSeparator() +
                pythonAPIConfig.getGetLocationUrl() + System.lineSeparator() +
                pythonAPIConfig.getMakePlanUrl() + System.lineSeparator() +
                pythonAPIConfig.getRegeneratePlanUrl() + System.lineSeparator() +
                pythonAPIConfig.getForecastUrl();
    }

    @PostMapping("/mock")
    public ResponseEntity<List<LocationDTO>> mock(
            @RequestBody List<RawLocationDTO> rawLocations) {

        List<LocationDTO> response = aiAPIService.convertRawToLocationDTO(rawLocations);

        return ResponseEntity.ok(response);
    }



}
