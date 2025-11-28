package com.exproject.backend.location_img.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LocationImgDTO {
    private Long id;

    private String img_url;

    private String description;
}
