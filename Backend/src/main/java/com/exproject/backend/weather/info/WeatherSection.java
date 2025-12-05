package com.exproject.backend.weather.info;

import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.weather.dto.WeatherSectionResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "weather_section")
public class WeatherSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Positive
    private Integer dayNumber;

    private LocalDate date;

    @OneToMany(mappedBy = "weatherSection", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    List<HourlyWeather> hourlyWeatherList = new ArrayList<>();


    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_section_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private TripSection tripSection;

    public WeatherSection(WeatherSectionResponse sectionResponse,Integer startDayNumber) {
        this.dayNumber = startDayNumber + sectionResponse.getDayNum();
        this.dayNumber = sectionResponse.getDayNum();
        this.date = sectionResponse.getDate();
        this.hourlyWeatherList = new ArrayList<>();
    }

    public void addHourlyWeather(HourlyWeather hourlyWeather) {
        hourlyWeatherList.add(hourlyWeather);
        hourlyWeather.setWeatherSection(this);
    }

}
