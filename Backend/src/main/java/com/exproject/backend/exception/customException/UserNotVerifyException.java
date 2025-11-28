package com.exproject.backend.exception.customException;

public class UserNotVerifyException extends RuntimeException {
    public UserNotVerifyException(String message) {
        super(message);
    }
}
