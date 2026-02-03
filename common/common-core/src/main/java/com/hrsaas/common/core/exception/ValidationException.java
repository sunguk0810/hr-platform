package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Exception for validation failures.
 */
public class ValidationException extends BusinessException {

    private final Map<String, List<String>> fieldErrors;

    public ValidationException(String message) {
        super("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
        this.fieldErrors = Collections.emptyMap();
    }

    public ValidationException(Map<String, List<String>> fieldErrors) {
        super("VALIDATION_ERROR", "Validation failed", HttpStatus.BAD_REQUEST);
        this.fieldErrors = fieldErrors;
    }

    public ValidationException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.BAD_REQUEST);
        this.fieldErrors = Collections.emptyMap();
    }

    public Map<String, List<String>> getFieldErrors() {
        return fieldErrors;
    }
}
