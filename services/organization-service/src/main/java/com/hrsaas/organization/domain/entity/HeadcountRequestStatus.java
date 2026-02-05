package com.hrsaas.organization.domain.entity;

/**
 * 정현원 변경 요청 상태
 */
public enum HeadcountRequestStatus {
    DRAFT,      // 초안
    PENDING,    // 승인 대기
    APPROVED,   // 승인
    REJECTED    // 반려
}
