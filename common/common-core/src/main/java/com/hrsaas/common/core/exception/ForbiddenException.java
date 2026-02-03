package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for forbidden access.
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException(String errorCode, String message) {
        super(errorCode, message, HttpStatus.FORBIDDEN);
    }
}
