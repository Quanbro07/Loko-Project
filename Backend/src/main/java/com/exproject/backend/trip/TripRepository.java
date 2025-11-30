package com.exproject.backend.trip;

import com.exproject.backend.trip.info.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findById(Long id);


    @Query("SELECT DISTINCT t FROM Trip t " +
            "LEFT JOIN FETCH t.tripSections ts " +
            "LEFT JOIN FETCH ts.tripDetails td " +
            "LEFT JOIN FETCH td.location l " +
            "LEFT JOIN FETCH l.province " +
            "WHERE t.id = :tripId")
    List<Trip> findTripGraphById(@Param("tripId") Long tripId);


    // Query 1: Lấy Trip và List Cấp 1
    @Query("SELECT DISTINCT t FROM Trip t " +
            "LEFT JOIN FETCH t.tripSections ts " +
            "WHERE t.id = :tripId")
    List<Trip> findTripWithSections(@Param("tripId") Long tripId);
}
