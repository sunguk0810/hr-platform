package com.hrsaas.common.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Standard error codes for the application.
 */
public enum ErrorCode {
    // Common errors
    RESOURCE_NOT_FOUND("COMMON_001", "리소스를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    INVALID_REQUEST("COMMON_002", "잘못된 요청입니다", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("COMMON_003", "인증이 필요합니다", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("COMMON_004", "접근 권한이 없습니다", HttpStatus.FORBIDDEN),
    DUPLICATE_RESOURCE("COMMON_005", "이미 존재하는 리소스입니다", HttpStatus.CONFLICT),
    VALIDATION_ERROR("COMMON_006", "유효성 검증 실패", HttpStatus.BAD_REQUEST),
    INTERNAL_ERROR("COMMON_007", "내부 서버 오류", HttpStatus.INTERNAL_SERVER_ERROR),
    EXTERNAL_SERVICE_ERROR("COMMON_008", "외부 서비스 오류", HttpStatus.SERVICE_UNAVAILABLE),

    // Authentication errors
    INVALID_CREDENTIALS("AUTH_001", "잘못된 인증 정보입니다", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("AUTH_002", "토큰이 만료되었습니다", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("AUTH_003", "유효하지 않은 토큰입니다", HttpStatus.UNAUTHORIZED),

    // Business errors
    BUSINESS_RULE_VIOLATION("BIZ_001", "비즈니스 규칙 위반", HttpStatus.BAD_REQUEST),
    STATE_TRANSITION_ERROR("BIZ_002", "상태 전환 오류", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
