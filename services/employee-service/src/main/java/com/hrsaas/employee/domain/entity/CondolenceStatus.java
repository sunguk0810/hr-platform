package com.hrsaas.employee.domain.entity;

/**
 * 경조비 신청 상태
 */
public enum CondolenceStatus {
    PENDING,    // 대기
    APPROVED,   // 승인
    REJECTED,   // 반려
    PAID,       // 지급 완료
    CANCELLED   // 취소
}
