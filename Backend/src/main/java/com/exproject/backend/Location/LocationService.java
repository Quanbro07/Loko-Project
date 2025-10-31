package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationRequest;
import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.province.Province;
import com.exproject.backend.province.ProvinceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final ProvinceRepository provinceRepository;

    public LocationService(LocationRepository locationRepository,
                           ProvinceRepository provinceRepository) {
        this.locationRepository = locationRepository;
        this.provinceRepository = provinceRepository;
    }

    public LocationResponse create(LocationRequest request) {
        Province province = provinceRepository.findById(request.getProvinceId())
                .orElseThrow(() -> new RuntimeException("Province not found"));

        Location location = new Location();
        location.setProvince(province);
        location.setLocationName(request.getLocationName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setOpenTime(request.getOpenTime());
        location.setAvgVisitTime(request.getAvgVisitTime());
        location.setTicketPrice(request.getTicketPrice());
        location.setGgPlaceId(request.getGgPlaceId());

        Location saved = locationRepository.save(location);
        return toResponse(saved);
    }

    public List<LocationResponse> getAll() {
        return locationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<LocationResponse> getByProvince(Long provinceId) {
        return locationRepository.findByProvince_Id(provinceId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private LocationResponse toResponse(Location loc) {
        return new LocationResponse(
                loc.getId(),
                loc.getProvince().getId(),
                loc.getProvince().getProvinceName(),
                loc.getLocationName(),
                loc.getLatitude(),
                loc.getLongitude(),
                loc.getOpenTime(),
                loc.getAvgVisitTime(),
                loc.getTicketPrice(),
                loc.getGgPlaceId()
        );
    }
}
