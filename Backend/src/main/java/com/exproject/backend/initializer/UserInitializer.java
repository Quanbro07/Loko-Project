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
                .email("Quanbroisdead@gmail.com")
                .password(passwordEncoder.encode("Quanbroisdead"))
                .age(19)
                .role(Role.USER)
                .gender(Gender.MALE)
                .enabled(true)
                .build();

        userRepository.save(user1);

        AuthenticationRequest authenticationRequest = AuthenticationRequest.builder()
                .email("Quanbroisdead@gmail.com")
                .password("Quanbroisdead")
                .build();

        AuthenticationResponse response = authenticationService.authenticate(authenticationRequest);

        System.out.println("Token: " + response.getAccessToken());
    }
}
