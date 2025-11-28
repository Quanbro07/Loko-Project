package com.exproject.backend.exception.customException;

public class VerificationCodeExpireException extends RuntimeException {
    public VerificationCodeExpireException(String message) {
        super(message);
    }
}
