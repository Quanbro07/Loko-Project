package com.exproject.backend.trip_history;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripHistoryRepository extends JpaRepository<TripHistory, Long> {

    List<TripHistory> findByTrip_Id(Long tripId);

    List<TripHistory> findByLocation_Id(Long locationId);
}
