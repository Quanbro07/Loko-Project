package com.exproject.backend.trip_history;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.trip.Trip;
import com.exproject.backend.trip.TripRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TripHistoryService {

    private final TripHistoryRepository tripHistoryRepository;
    private final TripRepository tripRepository;
    private final LocationRepository locationRepository;

    public TripHistoryService(TripHistoryRepository tripHistoryRepository,
                              TripRepository tripRepository,
                              LocationRepository locationRepository) {
        this.tripHistoryRepository = tripHistoryRepository;
        this.tripRepository = tripRepository;
        this.locationRepository = locationRepository;
    }


}
