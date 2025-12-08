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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Order(1)
public class UserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    private final AuthenticationService authenticationService;

    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {
        Optional<User> checkExistUser1 = userRepository.findByEmail("ngocquan612006@gmail.com");
        Optional<User> checkExistUser2 = userRepository.findByEmail("hs.nguyenthanhtrong@gmail.com");


        // User1 chưa có
        // Mồi vào DB
        if(checkExistUser1.isEmpty()) {
            // Tạo User 1
            User user1 = User.builder()
                    .username("Quanbro7")
                    .fullName("Trần Ngọc Quân")
                    .email("ngocquan612006@gmail.com")
                    .password(passwordEncoder.encode("Quanbroisdead"))
                    .age(19)
                    .dob(LocalDate.of(2006,1,6))
                    .role(Role.USER)
                    .gender(Gender.MALE)
                    .makeFullPlanTime(1)
                    .lastMakeFullPlanDate(LocalDate.now())
                    .makePartPlanTime(3)
                    .lastMakePartPlanDate(LocalDate.now())
                    .createAt(LocalDate.now())
                    .enabled(true)
                    .build();



            // Luu User 1
            userRepository.save(user1);

            System.out.println("Create new User 1");

        }
        else {
            User existUser1 = checkExistUser1.get();
            existUser1.setPassword(passwordEncoder.encode("Quanbroisdead"));
            existUser1.setEnabled(true);
            existUser1.setMakeFullPlanTime(1);
            existUser1.setLastMakeFullPlanDate(LocalDate.now());
            existUser1.setMakePartPlanTime(3);
            existUser1.setLastMakePartPlanDate(LocalDate.now());

            userRepository.save(existUser1);
            System.out.println("User 1 existed. Forced ENABLED = true and reset password.");
        }


        // User2 chua co
        // Mồi vào DB
        if(checkExistUser2.isEmpty()) {
            User user2 = User.builder()
                    .username("TrongChicken")
                    .fullName("Nguyen Thanh Trong")
                    .email("hs.nguyenthanhtrong@gmail.com")
                    .password(passwordEncoder.encode("trongbro7"))
                    .age(21)
                    .dob(LocalDate.of(2004,1,1))
                    .role(Role.ADMIN)
                    .gender(Gender.MALE)
                    .createAt(LocalDate.now())
                    .enabled(true)
                    .build();

            userRepository.save(user2);

            System.out.println("Create new User 2");

        }
        else {
            User existUser2 = checkExistUser2.get();

            existUser2.setPassword(passwordEncoder.encode("trongbro7"));
            existUser2.setEnabled(true);
            userRepository.save(existUser2);
            System.out.println("User 2 existed. Forced ENABLED = true and reset password.");
        }

        // Authenticate User 1
        AuthenticationRequest authenticationRequest1 = AuthenticationRequest.builder()
                .email("ngocquan612006@gmail.com")
                .password("Quanbroisdead")
                .build();

        AuthenticationRequest authenticationRequest2 = AuthenticationRequest.builder()
                .email("hs.nguyenthanhtrong@gmail.com")
                .password("trongbro7")
                .build();

        try {
            AuthenticationResponse responseUser = authenticationService.authenticate(authenticationRequest1);
            System.out.println("Token User: " + responseUser.getAccessToken());
        }
        catch(Exception e) {
            System.out.println("Error authenticating USER ");
        }

        try {
            AuthenticationResponse responseAdmin = authenticationService.authenticate(authenticationRequest2);

            System.out.println("Token Admin: " + responseAdmin.getAccessToken());
        }
        catch(Exception e) {
            System.out.println("Error authenticating ADMIN ");
        }
    }
}
