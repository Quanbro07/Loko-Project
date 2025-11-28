package com.exproject.backend.trip_history;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/trip-histories")
public class TripHistoryController {

    private final TripHistoryService tripHistoryService;



}
