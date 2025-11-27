package com.exproject.backend.categorySyncStat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategorySyncStatDTO {
    private Long provinceId;

    private Long locationCategoryId;

    private String provinceName;

    private String locationCategoryName;

    private Integer usageCount;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastSyncedAt;
}
