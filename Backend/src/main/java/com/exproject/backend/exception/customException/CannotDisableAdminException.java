package com.exproject.backend.exception.customException;

public class CannotDisableAdminException extends RuntimeException {
    public CannotDisableAdminException(String message) {
        super(message);
    }
}
