package com.exproject.backend.location_category.info;

import com.exproject.backend.categorySyncStat.CategorySyncStat;
import com.exproject.backend.location.Location;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "location_category")
public class LocationCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String locationCategoryName;

    @ManyToMany(mappedBy = "locationCategories",fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private List<Location> locations;

    @OneToMany(mappedBy = "locationCategory",fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private List<CategorySyncStat> locationCategorySyncStats;


    public LocationCategory(ELocationCategory category) {
        this.locationCategoryName = category.name();
    }
}
