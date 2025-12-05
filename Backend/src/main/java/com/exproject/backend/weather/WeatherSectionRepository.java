package com.exproject.backend.weather;

import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.weather.info.WeatherSection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeatherSectionRepository extends CrudRepository<WeatherSection, Long> {
    // Query 4: Fetch Weather data (Section -> Hourly + Alert)
    @Query("SELECT DISTINCT ws FROM WeatherSection ws " +
            "LEFT JOIN FETCH ws.hourlyWeatherList " +  // Lấy danh sách giờ (1:N)
            "WHERE ws.tripSection IN :sections")       // Chỉ lấy cho các section của trip này
    List<WeatherSection> fetchWeatherForSections(@Param("sections") List<TripSection> sections);

    @Query("SELECT ws FROM WeatherSection ws WHERE ws.date = :date")
    Optional<WeatherSection> findByDate(@Param("date")LocalDate date);
}
