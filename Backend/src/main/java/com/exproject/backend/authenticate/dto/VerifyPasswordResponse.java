package com.exproject.backend.authenticate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPasswordResponse {
    private String status;

    private String message;

    private String email;

    private String jwtToken;

    private LocalDateTime resetExpireDate;

}
