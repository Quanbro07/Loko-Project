package com.exproject.backend.trip.info;

import com.exproject.backend.review_location.ReviewLocation;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip_history.TripHistory;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "trip")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripSection> tripSections = new ArrayList<>();

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewLocation> reviewLocations = new ArrayList<>();

    @OneToOne(mappedBy = "trip",cascade = CascadeType.ALL, orphanRemoval = true)
    private TripHistory tripHistory;

    @Column(name = "trip_name", nullable = false)
    private String tripName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "num_adult")
    private Integer numAdult;

    @Column(name = "num_child")
    private Integer numChild;

    @Column(name = "num_elder")
    private Integer numElder;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private TripStatus status;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "current_trip_section_id")
    private Long currentTripSectionId;
    
    @Column(name = "current_trip_detail_id")
    private Long currentTripDetailId;



    // Constructor
    public Trip(TripRequest tripRequest, User user) {
        this.user = user;

        this.tripName = tripRequest.getTripName();

        this.startDate = tripRequest.getStartDate();
        this.endDate = tripRequest.getEndDate();

        this.numAdult = tripRequest.getNumAdult();
        this.numChild = tripRequest.getNumChild();
        this.numElder = tripRequest.getNumElder();

        this.status = TripStatus.IN_PROGRESS;

        this.createAt = LocalDateTime.now();
    }

    // Help Function
    public void addTripSection(TripSection tripSection) {
        // Add trip section vào List của trip
        tripSections.add(tripSection);

        // Set khóa ngoại cho chủ(Section)
        tripSection.setTrip(this);
    }

    public void addTripHistory(TripHistory tripHistory) {
        this.tripHistory = tripHistory;

        tripHistory.setTrip(this);
    }

    public void addReviewLocation(ReviewLocation reviewLocation) {
        this.reviewLocations.add(reviewLocation);

        reviewLocation.setTrip(this);
    }
}
