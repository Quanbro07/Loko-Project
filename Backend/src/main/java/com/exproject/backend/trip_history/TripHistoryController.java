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

}
