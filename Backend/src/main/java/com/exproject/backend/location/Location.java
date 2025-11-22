package com.exproject.backend.location;

import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.review_location.ReviewLocation;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "location")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gg_place_id", unique = true, nullable = false)
    private String ggPlaceId;

    // FK tới province
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id", nullable = false)
    @JsonIgnore
    private Province province;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewLocation> reviewLocations = new ArrayList<>();

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LocationImg> locationImgs = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "location_category_map",
            joinColumns = @JoinColumn(name = "location_id"),
            inverseJoinColumns = @JoinColumn(name = "location_category_id")
    )
    private List<LocationCategory> locationCategories = new ArrayList<>();

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "open_time")
    private String openTime;

    @Column(name = "avg_visit_time")
    private String avgVisitTime;

    @Column(name = "ticket_price")
    private Double ticketPrice;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    public void addLocationImg(LocationImg locationImg) {
        this.locationImgs.add(locationImg);

        locationImg.setLocation(this);
    }

    public void addReviewLocation(ReviewLocation reviewLocation) {
        this.reviewLocations.add(reviewLocation);

        reviewLocation.setLocation(this);
    }

    public void addLocationCategory(LocationCategory existCategory) {
        this.locationCategories.add(existCategory);

        existCategory.getLocations().add(this);
    }
}
