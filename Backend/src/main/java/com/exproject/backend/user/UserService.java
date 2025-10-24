package com.exproject.backend.user;

import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUser(Long id) {
        User existUser = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not Found"));

        UserResponse userResponse = UserResponse.builder()
                .username(existUser.getUsername())
                .email(existUser.getEmail())
                .age(existUser.getAge())
                .gender(existUser.getGender())
                .role(existUser.getRole())
                .build();

        return userResponse;
    }
}
