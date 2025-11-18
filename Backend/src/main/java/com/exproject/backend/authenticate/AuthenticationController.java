package com.exproject.backend.authenticate;

import com.exproject.backend.authenticate.dto.*;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    // Sign up
    @PostMapping("/register")
    public ResponseEntity<PendingVerificationResponse> register(
            @RequestBody RegisterRequest registerRequest) {

        PendingVerificationResponse pendingResponse =
                authenticationService.register(registerRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(pendingResponse);
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

    // Verify Email
    @PostMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(
        @RequestBody VerifyRequest verifyRequest) {

         VerifyResponse verifyResponse = authenticationService.verifyUser(verifyRequest);

        return ResponseEntity.ok(verifyResponse);
    }

    // Resend Code verify Email
    @PostMapping("/resend")
    public ResponseEntity<VerifyResponse> resend(
            @RequestParam String email) {
        VerifyResponse verifyResponse = authenticationService.resendVerificationEmail(email);

        return ResponseEntity.ok(verifyResponse);
    }

    @PostMapping("/forget-password")
    public ResponseEntity<PendingVerificationResponse> forgetPassword(
            @RequestParam String email) {
        PendingVerificationResponse passwordVerifyResponse =
                authenticationService.forgetPassword(email);

        return ResponseEntity.ok(passwordVerifyResponse);
    }

    @PostMapping("/verify-password")
    public ResponseEntity<VerifyPasswordResponse> verifyPassword(
            @RequestBody VerifyRequest request) {

        VerifyPasswordResponse verifyPasswordResponse =
                authenticationService.verifyPassword(request);

        return ResponseEntity.ok(verifyPasswordResponse);
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<VerifyResponse> changePassword(
            @RequestBody PasswordRequest request) {

        VerifyResponse verifyResponse = authenticationService.changePassword(request);

        return ResponseEntity.ok(verifyResponse);
    }


}
