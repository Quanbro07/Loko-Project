package com.exproject.backend.avatar.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvatarDTO {
    private Long userId;

    private String type;

    private String message;
}
