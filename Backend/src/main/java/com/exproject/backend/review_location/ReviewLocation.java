package com.exproject.backend.review_location;

import com.exproject.backend.location.Location;
import com.exproject.backend.review_location.dto.ReviewLocationRequest;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "review_location")
public class ReviewLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    private Double rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private LocalDate createAt;


    // Chỉ set rating + comment
    // mối quan he 2 chiều User location Trip <- do Owner add
    public ReviewLocation(ReviewLocationRequest reviewLocationRequest) {
        this.rating = reviewLocationRequest.getRating();
        this.comment = reviewLocationRequest.getComment();
        this.createAt = LocalDate.now();
    }
}
