package com.exproject.backend.user.dto;

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
public class UserDTO {
    private Long userId;

    private String userName;

    private String fullName;

    private LocalDate dob;

    private Gender gender;

}
