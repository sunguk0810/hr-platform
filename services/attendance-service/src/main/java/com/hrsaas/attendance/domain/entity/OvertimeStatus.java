package com.hrsaas.attendance.domain.entity;

public enum OvertimeStatus {
    PENDING,        // 승인 대기
    APPROVED,       // 승인됨
    REJECTED,       // 반려됨
    CANCELED,       // 취소됨
    COMPLETED       // 완료됨 (실제 근무 확인)
}
