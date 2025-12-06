package com.exproject.backend.trip;

import com.exproject.backend.makePlan.dto.MakePlanResponse;
import com.exproject.backend.route.dto.RouteResponse;
import com.exproject.backend.trip.dto.*;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trip")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping("/create")
    public ResponseEntity<String> createTrip(@RequestBody SaveTripPayload request) {
        tripService.createFullTrip(request.getTripRequest(),request.getRouteResponse());


        return ResponseEntity.status(HttpStatus.CREATED).body("Create Trip successful");
    }

    // Get Trip cùng với Trip Section, Trip Detail, Location, Location Img, Location Categories
    @GetMapping("/get")
    public ResponseEntity<MakePlanResponse> getTrip(@RequestParam Long tripId) {

        MakePlanResponse response = tripService.getFullTrip(tripId);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/complete")
    public ResponseEntity<Void> completeTrip(@RequestParam Long tripId) {
        tripService.completeTrip(tripId);

        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // Gọi Hàm Update Progress
    @PostMapping("/update-progress")
    public ResponseEntity<Void> upodateTripProgress(
            @RequestBody ProgressUpdateDTO progressUpdateDTO) {

        tripService.updateTripProgress(progressUpdateDTO);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<Page<SimpleTripResponse>> getAllTrips(
            @AuthenticationPrincipal User user,
            @PageableDefault(page = 0, size = 20,sort = "startDate" ,direction = Sort.Direction.ASC)
                Pageable pageable)
    {
        Page<SimpleTripResponse> response = tripService.getAllTripSimple(user,pageable);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
