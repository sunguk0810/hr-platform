package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for resource not found scenarios.
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super("NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }

    public NotFoundException(String resourceType, Object id) {
        super("NOT_FOUND",
              String.format("%s not found with id: %s", resourceType, id),
              HttpStatus.NOT_FOUND);
    }

    public NotFoundException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.NOT_FOUND);
    }
}
