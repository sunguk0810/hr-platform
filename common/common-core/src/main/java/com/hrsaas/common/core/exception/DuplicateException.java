package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for duplicate resource scenarios.
 */
public class DuplicateException extends BusinessException {

    public DuplicateException(String message) {
        super("DUPLICATE", message, HttpStatus.CONFLICT);
    }

    public DuplicateException(String field, Object value) {
        super("DUPLICATE",
              String.format("Resource already exists with %s: %s", field, value),
              HttpStatus.CONFLICT);
    }

    public DuplicateException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.CONFLICT);
    }
}
