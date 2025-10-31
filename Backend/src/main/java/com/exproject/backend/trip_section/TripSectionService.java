package com.exproject.backend.trip_section;

import com.exproject.backend.trip.Trip;
import com.exproject.backend.trip.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TripSectionService {

    private final TripSectionRepository tripSectionRepository;
    private final TripRepository tripRepository;

    public TripSectionService(TripSectionRepository tripSectionRepository,
                              TripRepository tripRepository) {
        this.tripSectionRepository = tripSectionRepository;
        this.tripRepository = tripRepository;
    }

    public TripSection create(Long tripId, Integer dayNumber, String title, String description) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        TripSection section = new TripSection();
        section.setTrip(trip);
        section.setDayNumber(dayNumber);
        section.setTitle(title);
        section.setDescription(description);

        return tripSectionRepository.save(section);
    }

    public List<TripSection> getByTrip(Long tripId) {
        return tripSectionRepository.findByTrip_Id(tripId);
    }

    public TripSection update(Long id, Integer dayNumber, String title, String description) {
        TripSection section = tripSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TripSection not found"));

        section.setDayNumber(dayNumber);
        section.setTitle(title);
        section.setDescription(description);

        return tripSectionRepository.save(section);
    }

    public void delete(Long id) {
        tripSectionRepository.deleteById(id);
    }
}
