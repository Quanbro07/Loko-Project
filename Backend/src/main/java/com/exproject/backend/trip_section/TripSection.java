package com.exproject.backend.trip_section;

import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.exproject.backend.weather.info.WeatherSection;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
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

    // TODO: thêm biến date hiện tại #DONE
    @Column(name = "date")
    private LocalDate date;

    @Column(nullable = false)
    private String title;

    @OneToOne(mappedBy = "tripSection", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private WeatherSection weatherSection;

    // Constructor
    public TripSection(TripSectionRequest tripSectionRequest, LocalDate starDate) {
        this.dayNumber = tripSectionRequest.getDayNumber();
        this.date = starDate.plusDays(tripSectionRequest.getDayNumber() - 1);
        this.title = tripSectionRequest.getTitle();
    }

    // Helper
    public void addTripDetail(TripDetail tripDetail) {
        this.tripDetails.add(tripDetail);

        tripDetail.setTripSection(this);
    }

    public void addWeatherSection(WeatherSection weatherSection) {
        this.weatherSection = weatherSection;
        if (weatherSection != null) {
            weatherSection.setTripSection(this);
        }
    }
}
