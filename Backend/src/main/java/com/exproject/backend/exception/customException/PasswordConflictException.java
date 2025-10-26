package com.exproject.backend.exception.customException;

public class PasswordConflictException extends RuntimeException {
    public PasswordConflictException(String message) {
        super(message);
    }
}
