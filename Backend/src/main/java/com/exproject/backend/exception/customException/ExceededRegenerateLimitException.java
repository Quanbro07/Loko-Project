package com.exproject.backend.exception.customException;

public class ExceededRegenerateLimitException extends RuntimeException {
    public ExceededRegenerateLimitException(String message) {
        super(message);
    }
}
