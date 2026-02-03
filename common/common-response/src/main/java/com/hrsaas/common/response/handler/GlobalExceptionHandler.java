package com.hrsaas.common.response.handler;

import com.hrsaas.common.core.exception.*;
import com.hrsaas.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Global exception handler for REST APIs.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {
        log.warn("Business exception: code={}, message={}", ex.getErrorCode(), ex.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(
            NotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(DuplicateException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateException(
            DuplicateException ex, HttpServletRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenException(
            ForbiddenException ex, HttpServletRequest request) {
        log.warn("Access forbidden: {}", ex.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex, HttpServletRequest request) {
        log.warn("Validation failed: {}", ex.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = ex.getFieldErrors().entrySet().stream()
            .flatMap(entry -> entry.getValue().stream()
                .map(msg -> ErrorResponse.FieldError.builder()
                    .field(entry.getKey())
                    .reason(msg)
                    .build()))
            .collect(Collectors.toList());

        ErrorResponse response = ErrorResponse.builder()
            .success(false)
            .code(ex.getErrorCode())
            .message(ex.getMessage())
            .errors(fieldErrors)
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation failed: {}", ex.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> ErrorResponse.FieldError.builder()
                .field(error.getField())
                .value(error.getRejectedValue())
                .reason(error.getDefaultMessage())
                .build())
            .collect(Collectors.toList());

        ErrorResponse response = ErrorResponse.builder()
            .success(false)
            .code("VALIDATION_ERROR")
            .message("입력값 검증에 실패했습니다.")
            .errors(fieldErrors)
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException ex, HttpServletRequest request) {
        log.warn("Binding failed: {}", ex.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> ErrorResponse.FieldError.builder()
                .field(error.getField())
                .value(error.getRejectedValue())
                .reason(error.getDefaultMessage())
                .build())
            .collect(Collectors.toList());

        ErrorResponse response = ErrorResponse.builder()
            .success(false)
            .code("VALIDATION_ERROR")
            .message("요청 파라미터 검증에 실패했습니다.")
            .errors(fieldErrors)
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        log.warn("Missing parameter: {}", ex.getParameterName());

        ErrorResponse response = ErrorResponse.of(
            "MISSING_PARAMETER",
            String.format("필수 파라미터 '%s'가 누락되었습니다.", ex.getParameterName()),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        log.warn("Type mismatch: parameter={}, value={}", ex.getName(), ex.getValue());

        ErrorResponse response = ErrorResponse.of(
            "TYPE_MISMATCH",
            String.format("파라미터 '%s'의 타입이 올바르지 않습니다.", ex.getName()),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ErrorResponse> handleExternalServiceException(
            ExternalServiceException ex, HttpServletRequest request) {
        log.error("External service error: service={}, message={}",
                  ex.getServiceName(), ex.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected error: ", ex);

        ErrorResponse response = ErrorResponse.of(
            "INTERNAL_SERVER_ERROR",
            "서버 내부 오류가 발생했습니다.",
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
