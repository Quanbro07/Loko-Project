package com.exproject.backend.weather.info;

import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.weather.dto.AlertWeatherResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "alert_weather")
public class AlertWeather {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_line")
    private String headline;

    @Column(name = "severity")
    private String severity;

    @Column(name = "areas")
    private String areas;

    @Column(name = "description")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Trip trip;

    public AlertWeather(AlertWeatherResponse alertWeatherResponse) {
        this.headline = alertWeatherResponse.getHeadline();
        this.severity = alertWeatherResponse.getSeverity();
        this.areas = alertWeatherResponse.getAreas();
        this.description = alertWeatherResponse.getDescription();
    }
}
