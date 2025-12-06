package com.exproject.backend.makePlan;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.hobby.info.EHobby;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationMapper;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location.dto.LocationRequest;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.makePlan.dto.*;
import com.exproject.backend.province.info.EProvince;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.exproject.backend.makePlan.dto.MakePlanRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/make-plan")
public class MakePlanController {
    private final MakePlanService makePlanService;

    private final LocationRepository locationRepository;

    private final LocationMapper locationMapper;


    @PostMapping("/make")
    public ResponseEntity<TripRequest> makePlan(
            @AuthenticationPrincipal User user,
            @RequestBody MakePlanRequest request) {
        System.out.println("Make Plan Request: " + request.getRejectedLocations());
        TripRequest response = makePlanService.makePlan(request,user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/regenerate-part")
    public ResponseEntity<RegeneratePlanPartResponse> regeneratePartPlan(
            @RequestBody RegeneratePlanPartRequest request) {
        System.out.println("Regenerate Plan Request: " + request.getRejectedDetail().size());
        RegeneratePlanPartResponse response = makePlanService.regeneratePlanPart(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /*@PostMapping("/regenerate-full")
    public ResponseEntity<TripRequest> regenerateFullPlan(
            @AuthenticationPrincipal User user,
            @RequestBody RegeneratePlanFullRequest request) {

        TripRequest response = makePlanService.regeneratePlanFull(request,user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }*/

    // Test API
    @GetMapping("/test-plan")
    public ResponseEntity<MakePlanRequest> testPlan(
            @RequestBody MakePlanRequest request
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(request);
    }


    @GetMapping("/test")
    public ResponseEntity<MakePlanRequest> test() {
        List<Location> testLocations = locationRepository.findAllByIdIn(List.of(1L, 2L, 3L));
        List<LocationDTO> testLocationsMapper = testLocations.stream()
                .map(locationMapper::toLocationDTO)
                .collect(Collectors.toList());


        MakePlanRequest test = new MakePlanRequest();
        test.setStartDate(LocalDate.now());
        test.setEndDate(LocalDate.now().plusDays(3));
        test.setHobby(EHobby.BEACHISLANDTOUR);
        test.setProvince(EProvince.TPHCM);
        test.setIsAlone(true);
        test.setIsChildren(true);
        test.setNumChildren(1);
        test.setNumAdults(2);
        test.setIsElder(true);
        test.setNumElders(1);

        test.setFromOperateTime(LocalTime.now());
        test.setToOperateTime(LocalTime.now());
        test.setLocations(testLocationsMapper);

        return ResponseEntity.ok(test);
    }

    @PostMapping("/confirm")
    public ResponseEntity<MakePlanResponse> confirmMakePlan(
            @AuthenticationPrincipal User user,
            @RequestBody ConfirmPlanRequest request) {
        MakePlanResponse response = makePlanService.confirmMakePlan(request, user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
