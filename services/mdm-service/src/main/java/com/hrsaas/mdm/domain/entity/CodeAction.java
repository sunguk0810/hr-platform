package com.hrsaas.mdm.domain.entity;

/**
 * 코드 변경 액션 유형
 */
public enum CodeAction {
    /**
     * 생성
     */
    CREATED,

    /**
     * 수정
     */
    UPDATED,

    /**
     * 활성화
     */
    ACTIVATED,

    /**
     * 비활성화
     */
    DEACTIVATED,

    /**
     * 폐기
     */
    DEPRECATED,

    /**
     * 삭제
     */
    DELETED,

    /**
     * 마이그레이션
     */
    MIGRATED
}
