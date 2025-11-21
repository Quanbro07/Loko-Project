package com.exproject.backend.initializer;

import com.exproject.backend.authenticate.AuthenticationService;
import com.exproject.backend.authenticate.dto.AuthenticationRequest;
import com.exproject.backend.authenticate.dto.AuthenticationResponse;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.Gender;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Order(1)
public class UserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    private final AuthenticationService authenticationService;

    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {
        if(userRepository.count() > 0) {
            return;
        }

        User user1 = User.builder()
                .username("Quanbro7")
                .email("ngocquan612006@gmail.com")
                .password(passwordEncoder.encode("Quanbroisdead"))
                .age(19)
                .role(Role.USER)
                .gender(Gender.MALE)
                .enabled(true)
                .build();

        User user2 = User.builder()
                .username("TrongChicken")
                .email("hs.nguyenthanhtrong@gmail.com")
                .password(passwordEncoder.encode("trongbro7"))
                .age(21)
                .role(Role.ADMIN)
                .gender(Gender.MALE)
                .enabled(true)
                .build();

        userRepository.saveAll(List.of(user1,user2));

        AuthenticationRequest authenticationRequest1 = AuthenticationRequest.builder()
                .email("ngocquan612006@gmail.com")
                .password("Quanbroisdead")
                .build();

        AuthenticationRequest authenticationRequest2 = AuthenticationRequest.builder()
                .email("hs.nguyenthanhtrong@gmail.com")
                .password("trongbro7")
                .build();

        AuthenticationResponse responseUser = authenticationService.authenticate(authenticationRequest1);
        AuthenticationResponse responseAdmin = authenticationService.authenticate(authenticationRequest2);

        System.out.println("Token User: " + responseUser.getAccessToken());
        System.out.println("Token Admin: " + responseUser.getAccessToken());
    }
}
