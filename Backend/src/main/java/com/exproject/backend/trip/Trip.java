package com.exproject.backend.trip;

import com.exproject.backend.review_location.ReviewLocation;
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
    private List<TripSection> tripSections;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewLocation> reviews = new ArrayList<>();

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
    private Integer status;

    @Column(name = "create_at")
    private LocalDateTime createAt;
}
