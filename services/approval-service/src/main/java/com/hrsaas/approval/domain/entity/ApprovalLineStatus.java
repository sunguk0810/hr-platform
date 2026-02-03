package com.hrsaas.approval.domain.entity;

public enum ApprovalLineStatus {
    WAITING,    // 대기중 (아직 차례가 안됨)
    ACTIVE,     // 활성 (결재 차례)
    APPROVED,   // 승인
    REJECTED,   // 반려
    SKIPPED     // 건너뜀 (전결 등)
}
