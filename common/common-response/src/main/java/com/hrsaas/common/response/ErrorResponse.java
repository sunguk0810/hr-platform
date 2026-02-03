package com.hrsaas.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Error response structure.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String code;
    private String message;
    private List<FieldError> errors;
    private String path;
    private String traceId;
    private Instant timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldError {
        private String field;
        private Object value;
        private String reason;
    }

    public static ErrorResponse of(String code, String message) {
        return ErrorResponse.builder()
            .success(false)
            .code(code)
            .message(message)
            .timestamp(Instant.now())
            .build();
    }

    public static ErrorResponse of(String code, String message, String path) {
        return ErrorResponse.builder()
            .success(false)
            .code(code)
            .message(message)
            .path(path)
            .timestamp(Instant.now())
            .build();
    }

    public static ErrorResponse of(String code, String message, List<FieldError> errors) {
        return ErrorResponse.builder()
            .success(false)
            .code(code)
            .message(message)
            .errors(errors)
            .timestamp(Instant.now())
            .build();
    }
}
