package com.exproject.backend.trip;

import com.exproject.backend.trip.dto.ProgressUpdateDTO;
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
    public ResponseEntity<String> createTrip(@RequestBody TripRequest tripRequest) {
        tripService.createFullTrip(tripRequest);


        return ResponseEntity.status(HttpStatus.CREATED).body("Create Trip successful");
    }




    // Gọi Hàm Update Progress
    @PostMapping("/update-progress")
    public ResponseEntity<Void> upodateTripProgress(
            @RequestBody ProgressUpdateDTO progressUpdateDTO) {

        tripService.updateTripProgress(progressUpdateDTO);

        return ResponseEntity.noContent().build();
    }
}
