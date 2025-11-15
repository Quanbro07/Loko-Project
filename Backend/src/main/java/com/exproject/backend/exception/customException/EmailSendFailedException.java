package com.exproject.backend.exception.customException;

public class EmailSendFailedException extends RuntimeException {
    public EmailSendFailedException(String message) {
        super(message);
    }
}
