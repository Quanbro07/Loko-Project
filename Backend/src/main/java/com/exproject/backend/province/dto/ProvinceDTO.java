package com.exproject.backend.province.dto;

import com.exproject.backend.province.info.EProvince;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProvinceDTO {
    private Long provinceId;

    @JsonProperty("province_name")
    private String provinceName;
}
