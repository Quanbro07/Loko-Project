package com.exproject.backend.authenticate;

import com.exproject.backend.authenticate.dto.AuthenticationRequest;
import com.exproject.backend.authenticate.dto.AuthenticationResponse;
import com.exproject.backend.authenticate.dto.RefreshTokenRequest;
import com.exproject.backend.authenticate.dto.RegisterRequest;
import com.exproject.backend.config.JwtService;
import com.exproject.backend.exception.customException.InvalidTokenException;
import com.exproject.backend.exception.customException.PasswordConflictException;
import com.exproject.backend.exception.customException.UserAlreadyExistException;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.dto.UserResponse;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;

    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    private final UserDetailsService userDetailsService;

    // Register
    public AuthenticationResponse register(RegisterRequest registerRequest) {

        // Password != Configrm Password
        // => Throw lỗi
        if(!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new PasswordConflictException("Password and confirm password do not match");
        }

        Optional<User> existUser = userRepository.findByEmail(registerRequest.getEmail());

        // Nếu tòn tại email khi register
        // => Throw lỗi
        if(existUser.isPresent()) {
            throw new UserAlreadyExistException("User with email " +
                    registerRequest.getEmail() + " already exists");
        }

        User newUser = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .age(registerRequest.getAge())
                .role(Role.USER)
                .gender(registerRequest.getGender())
                .build();

        // lưu vao DB
        userRepository.save(newUser);

        String jwtAccessToken = jwtService.generateAccessToken(newUser);
        String jwtRefreshToken = jwtService.generateRefreshToken(newUser);

        UserResponse userResponse = UserResponse.builder()
                .username(newUser.getUsername())
                .email(newUser.getEmail())
                .age(newUser.getAge())
                .gender(newUser.getGender())
                .role(newUser.getRole())
                .build();

        return AuthenticationResponse.builder()
                .accessToken(jwtAccessToken)
                .refreshToken(jwtRefreshToken)
                .user(userResponse)
                .build();
    }

    // Authenticate
    public AuthenticationResponse authenticate(AuthenticationRequest authenticationRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authenticationRequest.getEmail(),
                        authenticationRequest.getPassword()
                )
        );

        User user = userRepository.findByEmail(authenticationRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String jwtAccessToken = jwtService.generateAccessToken(user);
        String jwtRefreshToken = jwtService.generateRefreshToken(user);

        UserResponse userResponse = UserResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .age(user.getAge())
                .gender(user.getGender())
                .role(user.getRole())
                .build();

        return AuthenticationResponse.builder()
                .accessToken(jwtAccessToken)
                .refreshToken(jwtRefreshToken)
                .user(userResponse)
                .build();
    }

    public AuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        final String refreshToken = refreshTokenRequest.getRefreshToken();

        String userEmail = jwtService.extractUsername(refreshToken);

        // Refresh Token không hợp lệ
        if(userEmail == null) {
            throw new InvalidTokenException("Refresh token user is invalid");
        }

        UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

        // Check Valid Token
        if(jwtService.isTokenValid(userDetails, refreshToken)) {

            String jwtAccessToken = jwtService.generateAccessToken(userDetails);

            return AuthenticationResponse.builder()
                    .accessToken(jwtAccessToken)
                    .refreshToken(refreshToken)
                    .build();
        }
        else {
            throw new InvalidTokenException("Refresh token is expired or invalid");
        }
    }
}
