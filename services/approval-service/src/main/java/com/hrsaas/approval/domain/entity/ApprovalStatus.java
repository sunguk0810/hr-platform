package com.hrsaas.approval.domain.entity;

public enum ApprovalStatus {
    DRAFT,          // 임시저장
    PENDING,        // 결재대기
    IN_PROGRESS,    // 결재진행중
    APPROVED,       // 승인완료
    REJECTED,       // 반려
    CANCELED,       // 취소
    RECALLED        // 회수
}
