package com.exproject.backend.aiAPI.dto;

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
public class RawLocationDTO {
    @JsonProperty("gg_place_id")
    private String ggPlaceId;

    @JsonProperty("location_name")
    private String locationName;

    private Double latitude;
    private Double longitude;

    @JsonProperty("open_time")
    @JsonFormat(shape = JsonFormat.Shape.STRING,pattern = "HH:mm")
    private LocalTime openTime;

    @JsonProperty("close_time")
    @JsonFormat(shape = JsonFormat.Shape.STRING,pattern = "HH:mm")
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

    @JsonProperty("category_ids")
    private List<Long> categoryIds;

    @JsonProperty("rawImgs")
    private List<RawLocationImgDTO> rawImgs;
}
