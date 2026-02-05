package com.hrsaas.employee.domain.entity;

/**
 * 전출/전입 상태
 */
public enum TransferStatus {
    DRAFT,              // 임시저장
    PENDING,            // 제출 (승인 대기)
    SOURCE_APPROVED,    // 전출 승인 (원 소속)
    TARGET_APPROVED,    // 전입 승인 (대상 소속)
    APPROVED,           // 최종 승인
    COMPLETED,          // 완료
    REJECTED,           // 거부
    CANCELLED           // 취소
}
