package com.exproject.backend.review_location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewLocationResponse {
    private Long id;

    private Long userId;

    private String userName;

    private Long locationId;

    private Long tripId;

    private Double rating;

    private String comment;

    private LocalDate createdAt;
}
