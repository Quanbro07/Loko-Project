package com.exproject.backend.trip_section;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripSectionRepository extends JpaRepository<TripSection, Long> {
    List<TripSection> findByTrip_Id(Long tripId);
}
