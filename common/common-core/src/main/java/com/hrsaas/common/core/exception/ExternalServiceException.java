package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception for external service failures.
 */
public class ExternalServiceException extends BusinessException {

    private final String serviceName;

    public ExternalServiceException(String serviceName, String message) {
        super("EXTERNAL_SERVICE_ERROR", message, HttpStatus.SERVICE_UNAVAILABLE);
        this.serviceName = serviceName;
    }

    public ExternalServiceException(String serviceName, String message, Throwable cause) {
        super("EXTERNAL_SERVICE_ERROR", message, cause);
        this.serviceName = serviceName;
    }

    public String getServiceName() {
        return serviceName;
    }
}
