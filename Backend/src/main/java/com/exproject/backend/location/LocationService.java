package com.exproject.backend.location;

import com.exproject.backend.location.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    public List<LocationResponse> getLocations(String provinceName) {
        List<Location> locationsList = locationRepository.findAllByProvince_ProvinceName(provinceName);

        List<LocationResponse> locationResponseList = new ArrayList<>();

        for (Location location : locationsList) {
            LocationResponse locationResponse = new LocationResponse(location);

            locationResponseList.add(locationResponse);
        }

        return locationResponseList;
    }

}
