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

    public TripHistory create(Long tripId, Long locationId, LocalDate visitDate) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        TripHistory th = new TripHistory();
        th.setTrip(trip);
        th.setLocation(location);
        th.setVisitDate(visitDate);

        return tripHistoryRepository.save(th);
    }

    public List<TripHistory> getByTrip(Long tripId) {
        return tripHistoryRepository.findByTrip_Id(tripId);
    }

    public List<TripHistory> getByLocation(Long locationId) {
        return tripHistoryRepository.findByLocation_Id(locationId);
    }

    public void delete(Long id) {
        tripHistoryRepository.deleteById(id);
    }
}
