package com.exproject.backend.review_location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface review_location_repository extends JpaRepository<review_location, Long> {

    List<review_location> findByLocation_Id(Long locationId);

    List<review_location> findByUser_Id(Long userId);
}
