package com.exproject.backend.location_category;

import com.exproject.backend.location.Location;
import com.exproject.backend.location_category.info.LocationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LocationCategoryRepository extends JpaRepository<LocationCategory, Long> {
    Optional<LocationCategory> findByLocationCategoryName(String locationCategoryName);

    List<LocationCategory> findAllByIdIn(List<Long> ids);


}
