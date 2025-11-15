package com.exproject.backend.categorySyncStat;

import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.province.info.Province;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "category_sync_stat",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"province_id","location_category_id"})
        })
public class CategorySyncStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id")
    @JsonIgnoreProperties({"locations", "visitedUsers", "locationCategorySyncStats", "hibernateLazyInitializer", "handler"})
    private Province province;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_category_id")
    @JsonIgnoreProperties({"locations", "locationCategorySyncStats", "hibernateLazyInitializer", "handler"})
    private LocationCategory locationCategory;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer usageCount = 0;

    private LocalDateTime lastSyncedAt;
}
