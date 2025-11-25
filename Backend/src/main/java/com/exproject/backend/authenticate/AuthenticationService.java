package com.exproject.backend.authenticate;

import com.exproject.backend.authenticate.dto.*;
import com.exproject.backend.email.EmailService;
import com.exproject.backend.config.JwtService;
import com.exproject.backend.exception.customException.*;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.user.info.User;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;

    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    private final UserDetailsService userDetailsService;

    private final EmailService emailService;

    // Register
    public PendingVerificationResponse register(RegisterRequest registerRequest) {

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
                .enabled(false)
                .verificationCode(generateVerificationCode())
                .verificationExpireAt(LocalDateTime.now().plusMinutes(15))
                .resetPasswordToken(null)
                .resetPasswordExpiryAt(null)
                .build();

        try {
            // send Verify code cho email
            sendVerificationEmail(newUser);

            // lưu vao DB
            userRepository.save(newUser);

            return PendingVerificationResponse.builder()
                    .status("PENDING_VERIFICATION")
                    .message("Registration successful. Please check your email for the verification code.")
                    .email(newUser.getEmail())
                    .expireAt(newUser.getVerificationExpireAt())
                    .build();

        }
        catch (EmailSendFailedException e) {

            throw new EmailSendFailedException("Failed to send verification email. Please check your email address.");
        }
    }

    // Authenticate
    public AuthenticationResponse authenticate(AuthenticationRequest authenticationRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authenticationRequest.getEmail(),
                            authenticationRequest.getPassword()
                    )
            );

            User user = userRepository.findByEmail(authenticationRequest.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if(!user.isEnabled()) {
                throw new UserNotVerifyException("Your email is not verified");
            }

            String jwtAccessToken = jwtService.generateAccessToken(user);
            String jwtRefreshToken = jwtService.generateRefreshToken(user);

            return buildAuthenticationResponse(user,jwtAccessToken,jwtRefreshToken);

        }
        catch (BadCredentialsException e) {
            throw new EmailSendFailedException("Email or Password is incorrect");
        }
    }

    // Refresh Token
    public AuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        final String refreshToken = refreshTokenRequest.getRefreshToken();

        String userEmail = jwtService.extractUsername(refreshToken);

        // Refresh Token không hợp lệ
        if(userEmail == null) {
            throw new InvalidTokenException("Refresh token user is invalid");
        }

        UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

        User existUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Check Valid Token
        if(jwtService.isTokenValid(userDetails, refreshToken)) {

            String jwtAccessToken = jwtService.generateAccessToken(userDetails);

            return buildAuthenticationResponse(existUser,jwtAccessToken,refreshToken);
        }
        else {
            throw new InvalidTokenException("Refresh token is expired or invalid");
        }
    }

    // Verify Email
    public VerifyResponse verifyUser(VerifyRequest request) {
        User existUser = userRepository.findByEmail(request.getEmail()).
                orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Verify Code hết hạn
        if(existUser.getVerificationExpireAt().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpireException("Verification code expired");
        }

        // Verify code == request's verify code
        if(existUser.getVerificationCode().equals(request.getVerificationCode())) {
            existUser.setEnabled(true);
            existUser.setVerificationCode(null);
            existUser.setVerificationExpireAt(null);

            // Lưu vào database
            userRepository.save(existUser);
        }
        else {
            throw new InvalidVerificationCodeException("Invalid verification code");
        }
        return VerifyResponse.builder()
                .status("VERIFIED")
                .message("Account verified successfully")
                .email(existUser.getEmail())
                .build();
    }

    // Resend Verify Email
    public VerifyResponse resendVerificationEmail(String email) {
        User existUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if(existUser.isEnabled()) {
            throw new AccountAlreadyVerifiedException("User already verified");
        }

        existUser.setVerificationCode(generateVerificationCode());
        existUser.setVerificationExpireAt(LocalDateTime.now().plusMinutes(15));

        userRepository.save(existUser);

        try {
            sendVerificationEmail(existUser);
            userRepository.save(existUser);

            return VerifyResponse.builder()
                    .status("RESEND_VERIFICATION")
                    .message("Verification email resent successfully.")
                    .email(existUser.getEmail())
                    .build();

        } catch (EmailSendFailedException e) {
            throw new EmailSendFailedException("Failed to resend verification email. Please check your email address.");
        }
    }

    // Send Verifcation tới email
    private void sendVerificationEmail(User user) {
        String subject = "Account Verification";
        String verificationCode = user.getVerificationCode();

        String htmlMessage = "<html>"
                + "<body style=\"font-family: Arial, sans-serif;\">"
                + "<div style=\"background-color: #f5f5f5; padding: 20px;\">"
                + "<h2 style=\"color: #333;\">Welcome to our app!</h2>"
                + "<p style=\"font-size: 16px;\">Please enter the verification code below to continue:</p>"
                + "<div style=\"background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);\">"
                + "<h3 style=\"color: #333;\">Verification Code:</h3>"
                + "<p style=\"font-size: 18px; font-weight: bold; color: #007bff;\">" + verificationCode + "</p>"
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";

        try {
            emailService.sendVerificationEmail(user.getEmail(),subject,htmlMessage);
        }
        catch (MessagingException e) {
            throw new EmailSendFailedException("Failed to send verification email. Please check your email address.");

        }
    }

    // Send Verification Password Token
    private void sendVerificationPassword(User user) {
        String subject = "Password Verification";
        String verificationPasswordToken = user.getResetPasswordToken();

        String htmlMessage = "<html>"
                + "<body style=\"font-family: Arial, sans-serif;\">"
                + "<div style=\"background-color: #f5f5f5; padding: 20px;\">"
                + "<h2 style=\"color: #333;\">Welcome to our app!</h2>"
                + "<p style=\"font-size: 16px;\">Your password reset code is:</p>"
                + "<div style=\"background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);\">"
                + "<h3 style=\"color: #333;\">Verification Code:</h3>"
                + "<p style=\"font-size: 18px; font-weight: bold; color: #007bff;\">" + verificationPasswordToken + "</p>"
                + "</div>"
                + "</div>"
                + "</body>"
                + "</html>";

        try {
            emailService.sendVerificationEmail(user.getEmail(),subject,htmlMessage);
        }
        catch (MessagingException e) {
            throw new EmailSendFailedException("Failed to send verification email. Please check your email address.");

        }
    }

    // * Forget Password
    // Send Forget Password token
    public PendingVerificationResponse forgetPassword(String email) {
        User existUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));


        existUser.setResetPasswordToken(generateVerificationCode());
        existUser.setResetPasswordExpiryAt(LocalDateTime.now().plusMinutes(15));

        try {
            userRepository.save(existUser);

            sendVerificationPassword(existUser);

            return PendingVerificationResponse.builder()
                    .status("RESET_CODE_SENT")
                    .message("Reset password code sent to your email.")
                    .expireAt(existUser.getResetPasswordExpiryAt())
                    .email(existUser.getEmail())
                    .build();
        }
        catch (EmailSendFailedException e) {
            throw new EmailSendFailedException("Failed to send verification password. Please check your email address.");
        }
    }

    // Verify Password Token trước khi đổi mật khẩu thật sự
    public VerifyPasswordResponse verifyPassword(VerifyRequest request) {
        User existUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if(existUser.getResetPasswordExpiryAt().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpireException("Verification code expired");
        }

        if(!existUser.getResetPasswordToken().equals(request.getVerificationCode())) {
            throw new InvalidVerificationCodeException("Invalid verification code");
        }

        existUser.setResetPasswordToken(null);
        existUser.setResetPasswordExpiryAt(null);

        userRepository.save(existUser);

        // Tạo jwt token 10phut để đổi mật khẩu
        String jwtToken = jwtService.generateToken(new HashMap<>(),existUser,10 * 10 * 1000);

        return VerifyPasswordResponse.builder()
                .status("CODE_VERIFIED")
                .message("You can now change password")
                .email(existUser.getEmail())
                .jwtToken(jwtToken)
                .resetExpireDate(existUser.getResetPasswordExpiryAt())
                .build();
    }

    // Đổi mật khẩu thât sự
    public VerifyResponse changePassword(PasswordRequest request) {
        User existUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 2 Password ko giống nhau
        if(!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordConflictException("Passwords do not match");
        }

        existUser.setPassword(passwordEncoder.encode(request.getPassword()));

        // Remove reset password token
        userRepository.save(existUser);

        return VerifyResponse.builder()
                .status("CHANGE PASSWORD SUCCESSFULL")
                .message("Password has been changed successfully")
                .email(existUser.getEmail())
                .build();
    }

    // Generate Code
    private String generateVerificationCode() {
        Random random = new Random();
        int code =random.nextInt(900000)+100000;
        return String.valueOf(code);
    }



    // Build Response
    private AuthenticationResponse buildAuthenticationResponse(User user,
           String jwtAccessToken,
           String jwtRefreshToken)
    {

        return AuthenticationResponse.builder()
                .accessToken(jwtAccessToken)
                .refreshToken(jwtRefreshToken)
                .username(user.getDisplayUserName())
                .age(user.getAge())
                .gender(user.getGender())
                .role(user.getRole())
                .build();
    }
}
