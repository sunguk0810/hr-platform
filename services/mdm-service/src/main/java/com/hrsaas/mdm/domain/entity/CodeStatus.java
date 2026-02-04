package com.hrsaas.mdm.domain.entity;

/**
 * 코드 상태 열거형
 */
public enum CodeStatus {
    /**
     * 활성 상태 - 정상 사용 가능
     */
    ACTIVE,

    /**
     * 비활성 상태 - 일시적으로 사용 중지
     */
    INACTIVE,

    /**
     * 폐기 상태 - 더 이상 사용하지 않음 (마이그레이션 필요)
     */
    DEPRECATED
}
