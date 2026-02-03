package com.hrsaas.attendance.domain.entity;

public enum LeaveStatus {
    DRAFT,          // 임시저장
    PENDING,        // 결재대기
    APPROVED,       // 승인
    REJECTED,       // 반려
    CANCELED        // 취소
}
