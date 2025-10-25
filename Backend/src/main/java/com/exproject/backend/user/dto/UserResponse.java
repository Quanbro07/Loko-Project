package com.exproject.backend.user.dto;

import com.exproject.backend.user.info.Gender;
import com.exproject.backend.user.info.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private String username;

    private String email;

    private Integer age;

    private Gender gender;

    private Role role;
}
