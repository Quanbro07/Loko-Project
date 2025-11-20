package com.exproject.backend.location_category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationCategoryDTO {
    private Long id;

    private String categoryName;
}
