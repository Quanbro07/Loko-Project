package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationRequest;
import com.exproject.backend.location.dto.LocationResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @PostMapping
    public LocationResponse create(@RequestBody LocationRequest request) {
        return locationService.create(request);
    }

    @GetMapping
    public List<LocationResponse> getAll() {
        return locationService.getAll();
    }

    @GetMapping("/province/{provinceId}")
    public List<LocationResponse> getByProvince(@PathVariable Long provinceId) {
        return locationService.getByProvince(provinceId);
    }
}
