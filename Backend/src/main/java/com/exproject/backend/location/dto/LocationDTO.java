package com.exproject.backend.location.dto;

import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationDTO {
    private Long id;

    @JsonProperty("gg_place_id")
    private String ggPlaceId;

    @JsonProperty("location_name")
    private String locationName;

    private Double latitude;

    private Double longitude;

    @JsonFormat(shape = JsonFormat.Shape.STRING,pattern = "HH:mm")
    @JsonProperty("open_time")
    private LocalTime openTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING,pattern = "HH:mm")
    @JsonProperty("close_time")
    private LocalTime closeTime;

    @JsonProperty("avg_visit_time")
    private Long avgVisitTime;

    @JsonProperty("ticket_price")
    private Double ticketPrice;

    @JsonProperty("average_rating")
    private Double averageRating;

    @JsonProperty("review_count")
    private Integer reviewCount;

    @JsonProperty("province_id")
    private Long provinceId; // Hứng ID, không phải object

    @JsonProperty("description")
    private String description;

    @JsonProperty("categories")
    private List<LocationCategoryDTO> categories;

    @JsonProperty("imgs")
    private List<LocationImgDTO> imgs;
}
