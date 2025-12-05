package com.exproject.backend.weather.info;

import com.exproject.backend.weather.dto.ConditionWeatherResponse;
import com.exproject.backend.weather.dto.HourlyWeatherResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hourly_weather")
public class HourlyWeather {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_time")
    private LocalDateTime dateTime;

    private Double temperatureC;


    @Column(name = "text")
    private String text;

    @Column(name = "icon")
    private String icon;

    @Column(name = "will_it_rain")
    private Integer willItRain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weather_section_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private WeatherSection weatherSection;

    public HourlyWeather(HourlyWeatherResponse hourlyWeatherResponse) {
        ConditionWeatherResponse condition = hourlyWeatherResponse.getCondition();
        this.dateTime = hourlyWeatherResponse.getTime();
        this.text = condition.getText();
        this.icon = condition.getIconURL();
        this.temperatureC = hourlyWeatherResponse.getTempC();
        this.willItRain = hourlyWeatherResponse.getWillRain();
    }
}
