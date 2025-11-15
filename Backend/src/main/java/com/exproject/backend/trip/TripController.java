package com.exproject.backend.trip;

import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trip")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping("/create")
    public ResponseEntity<TripResponse> createTrip(@RequestBody TripRequest tripRequest) {
        TripResponse tripResponse = tripService.createFullTrip(tripRequest);


        return ResponseEntity.status(HttpStatus.CREATED).body(tripResponse);
    }

}
