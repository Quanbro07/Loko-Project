package com.exproject.backend.review_location;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class review_location_controller {

    private final review_location_service reviewlocationservice;

    public review_location_controller(review_location_service reviewlocationservice) {
        this.reviewlocationservice = reviewlocationservice;
    }

    @PostMapping
    public review_location create(@RequestParam Long userId,
                                  @RequestParam Long locationId,
                                  @RequestParam(required = false) Long tripId,
                                  @RequestParam Integer rating,
                                  @RequestParam(required = false) String comment) {
        return reviewlocationservice.create(userId, locationId, tripId, rating, comment);
    }

    @GetMapping("/location/{locationId}")
    public List<review_location> getByLocation(@PathVariable Long locationId) {
        return reviewlocationservice.getByLocation(locationId);
    }

    @GetMapping("/user/{userId}")
    public List<review_location> getByUser(@PathVariable Long userId) {
        return reviewlocationservice.getByUser(userId);
    }
}
