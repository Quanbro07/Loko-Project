package com.exproject.backend.authenticate.dto;

import com.exproject.backend.user.info.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterRequest {
    private String username;

    private String FullName;

    private String email;

    private String password;

    private String confirmPassword;

    private Integer age;

    private Gender gender;

    private LocalDate dob;
}
