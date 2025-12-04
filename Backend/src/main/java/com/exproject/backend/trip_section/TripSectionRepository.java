package com.exproject.backend.trip_section;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripSectionRepository extends JpaRepository<TripSection, Long> {
    List<TripSection> findByTrip_Id(Long tripId);

    // 2. Query 2: Lấy List Cấp 2 và các ManyToOne
    // Hàm này có thể ở TripRepository hoặc TripSectionRepository
    @Query("SELECT DISTINCT ts FROM TripSection ts " +
            "LEFT JOIN FETCH ts.tripDetails td " +
            "LEFT JOIN FETCH td.location loc " +
            "LEFT JOIN FETCH loc.province p " +
            "WHERE ts IN :sections") // <-- Lấy dữ liệu CHO các section đã có
    List<TripSection> fetchDetailsForSections(@Param("sections") List<TripSection> sections);

    // Query tách biệt để lấy Weather và HourlyWeather
    // Tránh conflict với TripDetails
    @Query("SELECT DISTINCT ts FROM TripSection ts " +
            "LEFT JOIN FETCH ts.weatherSection ws " +  // Lấy Weather
            "LEFT JOIN FETCH ws.hourlyWeatherList " +  // Lấy luôn Hourly để tránh N+1 cấp con
            "WHERE ts IN :sections")
    List<TripSection> fetchWeatherForSections(@Param("sections") List<TripSection> sections);
}
