package com.hrsaas.appointment.domain.entity;

/**
 * 발령 상세 상태
 */
public enum DetailStatus {
    /** 대기 */
    PENDING,
    /** 시행됨 */
    EXECUTED,
    /** 취소됨 */
    CANCELLED,
    /** 롤백됨 */
    ROLLED_BACK,
    /** 실패 */
    FAILED
}
