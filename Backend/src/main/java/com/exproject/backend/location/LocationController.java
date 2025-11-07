package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationRequest;
import com.exproject.backend.location.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/location")
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/get-locations")
    public ResponseEntity<List<LocationResponse>> getLocations(
            @RequestParam String provinceName) {

        List<LocationResponse> locationResponseList =
                locationService.getLocations(provinceName);

        return ResponseEntity.ok().body(locationResponseList);

    }

}
