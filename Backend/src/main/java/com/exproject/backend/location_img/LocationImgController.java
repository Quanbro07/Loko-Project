package com.exproject.backend.location_img;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/location-images")
public class LocationImgController {

    private final LocationImgRepository locationImgRepository;
    private final LocationRepository locationRepository;

    public LocationImgController(LocationImgRepository locationImgRepository,
                                 LocationRepository locationRepository) {
        this.locationImgRepository = locationImgRepository;
        this.locationRepository = locationRepository;
    }

    @PostMapping
    public LocationImg create(@RequestParam Long locationId,
                              @RequestParam String imgUrl,
                              @RequestParam(required = false) String description) {

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        LocationImg img = new LocationImg();
        img.setLocation(location);
        img.setImgUrl(imgUrl);
        img.setDescription(description);

        return locationImgRepository.save(img);
    }

    @GetMapping("/location/{locationId}")
    public List<LocationImg> getByLocation(@PathVariable Long locationId) {
        return locationImgRepository.findByLocation_Id(locationId);
    }
}
