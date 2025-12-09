package com.exproject.backend.exception;

import com.exproject.backend.exception.customException.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandle {

    // User exist Handle
    @ExceptionHandler(UserAlreadyExistException.class)
    public ResponseEntity<?> handleUserAlreadyExistException(UserAlreadyExistException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.CONFLICT.value(),
                                "error", "Conflict",
                                "message", ex.getMessage()
                        )
                );
    }

    // Password != ConfirmPassword
    @ExceptionHandler(PasswordConflictException.class)
    public ResponseEntity<?> handlePasswordConflict(PasswordConflictException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.CONFLICT.value(),
                                "error", "Conflict",
                                "message", ex.getMessage()
                        )
                );
    }

    @ExceptionHandler({
            BadCredentialsException.class,
            UsernameNotFoundException.class,
    })
    public ResponseEntity<?> handleAuthExceptions(Exception ex) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.UNAUTHORIZED.value(),
                                "error", "Unauthorized",
                                "message", ex.getMessage()
                        )
                );

    }

    // Không đủ quyền → 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", HttpStatus.FORBIDDEN.value(),
                        "error", "Forbidden",
                        "message", ex.getMessage()
                )
        );
    }

    // Token không hợp lệ
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<?> handleInvalidToken(InvalidTokenException ex) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.UNAUTHORIZED.value(),
                                "error", "Unauthorized",
                                "message", ex.getMessage()
                        )
                );

    }

    // Email gửi đến không hợp lệ
    @ExceptionHandler(EmailSendFailedException.class)
    public ResponseEntity<?> handleEmailSendFailedException(EmailSendFailedException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.BAD_REQUEST.value(),
                                "error", "Invalid Email Address",
                                "message", ex.getMessage()
                        )
                );

    }

    // User email chưa được verify
    @ExceptionHandler(UserNotVerifyException.class)
    public ResponseEntity<?> handleUserNotVerify(UserNotVerifyException ex) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.FORBIDDEN.value(),
                                "error", "Email Not Verify",
                                "message", ex.getMessage()
                        )
                );

    }

    // Verify Code hết hạn
    @ExceptionHandler(VerificationCodeExpireException.class)
    public ResponseEntity<?> handleVerificationCodeExpire(VerificationCodeExpireException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.BAD_REQUEST.value(),
                                "error", "Verification Code Expired",
                                "message", ex.getMessage()
                        )
                );

    }

    // Verify Code ko hợp lệ
    @ExceptionHandler(InvalidVerificationCodeException.class)
    public ResponseEntity<?> handleVerificationCodeInvalid(InvalidVerificationCodeException ex) {

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.CONFLICT.value(),
                                "error", "Invalid Verification Code",
                                "message", ex.getMessage()
                        )
                );

    }

    @ExceptionHandler(AccountAlreadyVerifiedException.class)
    public ResponseEntity<?> handleUserAlreadyVerfied(AccountAlreadyVerifiedException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.BAD_REQUEST.value(),
                                "error", "Account Already Verified",
                                "message", ex.getMessage()
                        )
                );

    }

    // Invalid Email or Password
    @ExceptionHandler(InvalidEmailOrPasswordException.class)
    public ResponseEntity<?> handleUserAlreadyVerfied(InvalidEmailOrPasswordException ex) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.UNAUTHORIZED.value(),
                                "error", "Invalid Email or Password",
                                "message", ex.getMessage()
                        )
                );

    }

    // Admin ko thể disable admin
    @ExceptionHandler(CannotDisableAdminException.class)
    public ResponseEntity<?> handlePasswordConflict(CannotDisableAdminException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.CONFLICT.value(),
                                "error", "Conflict",
                                "message", ex.getMessage()
                        )
                );
    }

    // Vượt ngưỡng Regenerate Limit
    @ExceptionHandler(ExceededRegenerateLimitException.class)
    public ResponseEntity<?> handlePasswordConflict(ExceededRegenerateLimitException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        Map.of(
                                "timestamp", LocalDateTime.now().toString(),
                                "status", HttpStatus.CONFLICT.value(),
                                "error", "Conflict",
                                "message", ex.getMessage()
                        )
                );
    }

    // Bắt Exception Còn lại
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "error", "Internal Server Error",
                        "message", ex.getMessage()
                )
        );
    }
}
