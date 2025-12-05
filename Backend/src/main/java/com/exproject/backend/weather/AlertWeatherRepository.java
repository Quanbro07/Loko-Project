package com.exproject.backend.weather;

import com.exproject.backend.weather.info.AlertWeather;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlertWeatherRepository extends CrudRepository<AlertWeather, Long> {
    @Query("SELECT a FROM AlertWeather a WHERE a.trip.id = :tripId")
    List<AlertWeather> findAllByTripId(@Param("tripId") Long tripId);
}
