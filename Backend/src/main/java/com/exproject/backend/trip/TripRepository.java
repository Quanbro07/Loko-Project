package com.exproject.backend.trip;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findById(Long id);
}
