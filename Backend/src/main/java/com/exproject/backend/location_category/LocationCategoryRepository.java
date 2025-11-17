package com.exproject.backend.location_category;

import com.exproject.backend.location_category.info.LocationCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LocationCategoryRepository extends JpaRepository<LocationCategory, Long> {
    Optional<LocationCategory> findByLocationCategoryName(String locationCategoryName);

}
