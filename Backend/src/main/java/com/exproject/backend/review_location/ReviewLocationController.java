package com.exproject.backend.review_location;

import com.exproject.backend.review_location.dto.ReviewLocationRequest;
import com.exproject.backend.review_location.dto.ReviewLocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/review")
public class ReviewLocationController {

    private final ReviewLocationService reviewLocationService;

    @PostMapping("/create")
    public ResponseEntity<ReviewLocationResponse> create(
            @RequestBody ReviewLocationRequest request) {

        ReviewLocationResponse response = reviewLocationService.createReviewLocation(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    @GetMapping("/get")
    public ResponseEntity<Page<ReviewLocationResponse>> getReviewLocations(
            @RequestParam Long locationId,
            @PageableDefault(size = 10,sort = "createAt", direction = Sort.Direction.DESC)
            Pageable pageable)
    {
        
        Page<ReviewLocationResponse> responseList = reviewLocationService.getReviewLocations(locationId,pageable);

        return new ResponseEntity<>(responseList, HttpStatus.OK);
    }

}
