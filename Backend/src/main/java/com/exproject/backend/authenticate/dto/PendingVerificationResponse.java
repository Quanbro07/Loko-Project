package com.exproject.backend.authenticate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PendingVerificationResponse {
    private String status;
    private String message;
    private String email;
    private LocalDateTime expireAt;
}
