package com.exproject.backend.location_category;

import com.exproject.backend.location_category.info.LocationCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationCategoryRepository extends JpaRepository<LocationCategory, Long> {

}
