package com.exproject.backend.categorySyncStat.dto;

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

    private LocalDateTime lastSyncedAt;
}
