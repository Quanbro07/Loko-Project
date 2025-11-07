package com.exproject.backend.trip_detail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripDetailRepository extends JpaRepository<TripDetail, Long> {

    List<TripDetail> findByTripSection_Id(Long tripSectionId);

    Optional<TripDetail> findById(long id);
}
