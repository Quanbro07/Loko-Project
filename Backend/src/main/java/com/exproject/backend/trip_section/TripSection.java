package com.exproject.backend.trip_section;

import com.exproject.backend.trip.Trip;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "trip_section")
public class TripSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @OneToMany(mappedBy = "tripSection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripDetail> tripDetails = new ArrayList<>();

    @Column(name = "day_number")
    private Integer dayNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Constructor
    public TripSection(TripSectionRequest tripSectionRequest) {
        this.dayNumber = tripSectionRequest.getDayNumber();
        this.title = tripSectionRequest.getTitle();
        this.description = tripSectionRequest.getDescription();
    }

    // Helper
    public void addTripDetail(TripDetail tripDetail) {
        this.tripDetails.add(tripDetail);

        tripDetail.setTripSection(this);
    }
}
