package com.exproject.backend.initializer;

import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_category.LocationCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocationCategoryInitializer implements CommandLineRunner {

    private final LocationCategoryRepository locationCategoryRepository;

    @Override
    public void run(String... args) throws Exception {
        for(ELocationCategory category : ELocationCategory.values()) {
            LocationCategory locationCategory = new LocationCategory(category);


            locationCategoryRepository.save(locationCategory);
        }
    }
}
