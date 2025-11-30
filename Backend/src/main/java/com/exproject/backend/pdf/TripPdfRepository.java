package com.exproject.backend.pdf;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TripPdfRepository extends JpaRepository<TripPdf, Long> {

    TripPdf findByTrip_Id(Long tripId);

}
