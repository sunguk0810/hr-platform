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
    USER_NOT_FOUND("AUTH_004", "사용자를 찾을 수 없습니다", HttpStatus.BAD_REQUEST),
    INVALID_RESET_TOKEN("AUTH_006", "유효하지 않은 리셋 토큰입니다", HttpStatus.BAD_REQUEST),
    EXPIRED_RESET_TOKEN("AUTH_007", "만료되었거나 이미 사용된 토큰입니다", HttpStatus.BAD_REQUEST),
    INACTIVE_ACCOUNT("AUTH_008", "비활성화된 계정입니다", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("AUTH_009", "계정이 잠겨있습니다", HttpStatus.UNAUTHORIZED),
    PASSWORD_EXPIRED("AUTH_010", "비밀번호가 만료되었습니다", HttpStatus.OK),
    PASSWORD_CONFIRM_MISMATCH("AUTH_011", "비밀번호 확인이 일치하지 않습니다", HttpStatus.BAD_REQUEST),
    CURRENT_PASSWORD_INVALID("AUTH_012", "현재 비밀번호가 올바르지 않습니다", HttpStatus.BAD_REQUEST),
    SESSION_NOT_FOUND("AUTH_013", "세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    PASSWORD_RECENTLY_USED("AUTH_014", "최근 사용한 비밀번호는 재사용할 수 없습니다", HttpStatus.BAD_REQUEST),

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
