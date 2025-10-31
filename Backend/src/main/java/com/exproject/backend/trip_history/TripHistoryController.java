package com.exproject.backend.trip_history;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trip-histories")
public class TripHistoryController {

    private final TripHistoryService tripHistoryService;

    public TripHistoryController(TripHistoryService tripHistoryService) {
        this.tripHistoryService = tripHistoryService;
    }

    @PostMapping
    public TripHistory create(@RequestParam Long tripId,
                              @RequestParam Long locationId,
                              @RequestParam
                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate) {
        return tripHistoryService.create(tripId, locationId, visitDate);
    }

    @GetMapping("/trip/{tripId}")
    public List<TripHistory> getByTrip(@PathVariable Long tripId) {
        return tripHistoryService.getByTrip(tripId);
    }

    @GetMapping("/location/{locationId}")
    public List<TripHistory> getByLocation(@PathVariable Long locationId) {
        return tripHistoryService.getByLocation(locationId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        tripHistoryService.delete(id);
    }
}
