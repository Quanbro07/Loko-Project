package com.exproject.backend.authenticate.dto;

import com.exproject.backend.user.info.Gender;
import com.exproject.backend.user.info.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthenticationResponse {
    private String accessToken;

    private String refreshToken;

    private Long userId;

    private String username;

    private String fullName;

    private Integer age;

    private Gender gender;

    private Role role;
    
    private Integer visitedProvince;

    private LocalDate dob;

    private LocalDate createAt;

    private byte[] avatarImg;

    private String avatarType;
}
