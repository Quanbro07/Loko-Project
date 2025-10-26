package com.exproject.backend.exception;

import com.exproject.backend.exception.customException.InvalidTokenException;
import com.exproject.backend.exception.customException.PasswordConflictException;
import com.exproject.backend.exception.customException.UserAlreadyExistException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.nio.file.AccessDeniedException;
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

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
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
