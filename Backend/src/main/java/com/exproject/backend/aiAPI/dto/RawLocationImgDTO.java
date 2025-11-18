package com.exproject.backend.aiAPI.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawLocationImgDTO {
    @JsonProperty("img_url")
    private String imgUrl;

    @JsonProperty("description")
    private String descrption;
}
