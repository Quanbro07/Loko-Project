package com.exproject.backend.trip;

import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public List<TripResponse> getAll() {
        return tripService.getAll();
    }

    @PostMapping
    public TripResponse create(@RequestBody TripRequest request) {
        return tripService.create(request);
    }
}
