package com.exproject.backend.authenticate;

import com.exproject.backend.authenticate.dto.AuthenticationRequest;
import com.exproject.backend.authenticate.dto.AuthenticationResponse;
import com.exproject.backend.authenticate.dto.RefreshTokenRequest;
import com.exproject.backend.authenticate.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    // Sign up
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest registerRequest) {

        AuthenticationResponse authResponse =
                authenticationService.register(registerRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authResponse);
    }

    // Sign in
    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest authenticationRequest) {

        AuthenticationResponse authResponse =
                authenticationService.authenticate(authenticationRequest);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(authResponse);
    }

    // Refresh Token
    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refreshToken(
            @RequestBody RefreshTokenRequest refreshTokenRequest) {

        AuthenticationResponse authResponse =
                authenticationService.refreshToken(refreshTokenRequest);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(authResponse);

    }
}
