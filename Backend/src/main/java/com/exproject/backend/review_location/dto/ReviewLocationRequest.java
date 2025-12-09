package com.exproject.backend.review_location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewLocationRequest {

    private Long locationId;

    private Long tripId;

    private Double rating;

    private String comment;
}
