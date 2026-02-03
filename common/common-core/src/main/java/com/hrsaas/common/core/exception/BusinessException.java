package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Base exception for all business exceptions.
 */
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final Object[] args;
    private final HttpStatus httpStatus;

    public BusinessException(String errorCode, String message) {
        this(errorCode, message, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.args = new Object[0];
    }

    public BusinessException(String errorCode, String message, HttpStatus httpStatus, Object... args) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.args = args;
    }

    public BusinessException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.args = new Object[0];
    }

    public String getErrorCode() {
        return errorCode;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public Object[] getArgs() {
        return args;
    }
}
