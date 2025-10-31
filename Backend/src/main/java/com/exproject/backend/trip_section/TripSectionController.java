package com.exproject.backend.trip_section;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trip-sections")
public class TripSectionController {

    private final TripSectionService tripSectionService;

    public TripSectionController(TripSectionService tripSectionService) {
        this.tripSectionService = tripSectionService;
    }

    @PostMapping
    public TripSection create(@RequestParam Long tripId,
                              @RequestParam Integer dayNumber,
                              @RequestParam String title,
                              @RequestParam(required = false) String description) {
        return tripSectionService.create(tripId, dayNumber, title, description);
    }

    @GetMapping("/trip/{tripId}")
    public List<TripSection> getByTrip(@PathVariable Long tripId) {
        return tripSectionService.getByTrip(tripId);
    }

    @PutMapping("/{id}")
    public TripSection update(@PathVariable Long id,
                              @RequestParam Integer dayNumber,
                              @RequestParam String title,
                              @RequestParam(required = false) String description) {
        return tripSectionService.update(id, dayNumber, title, description);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        tripSectionService.delete(id);
    }
}
