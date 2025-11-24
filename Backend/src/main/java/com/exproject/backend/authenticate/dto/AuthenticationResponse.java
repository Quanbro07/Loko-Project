package com.exproject.backend.authenticate.dto;

import com.exproject.backend.user.info.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthenticationResponse {
    private String accessToken;

    private String refreshToken;

    private String username;

    private Integer age;

    private Gender gender;

    private Role role;
}
