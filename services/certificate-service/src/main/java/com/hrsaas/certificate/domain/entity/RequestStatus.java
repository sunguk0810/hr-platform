package com.hrsaas.certificate.domain.entity;

/**
 * 증명서 신청 상태
 */
public enum RequestStatus {
    /** 대기중 */
    PENDING,
    /** 승인됨 */
    APPROVED,
    /** 반려됨 */
    REJECTED,
    /** 발급됨 */
    ISSUED,
    /** 취소됨 */
    CANCELLED,
    /** 만료됨 */
    EXPIRED
}
