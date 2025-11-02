package com.exproject.backend.review_location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewLocationRepository extends JpaRepository<ReviewLocation, Long> {

    List<ReviewLocation> findByLocation_Id(Long locationId);

    List<ReviewLocation> findByUser_Id(Long userId);
}
