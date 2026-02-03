package com.hrsaas.approval.domain.entity;

public enum ApprovalActionType {
    APPROVE,        // 승인
    REJECT,         // 반려
    DELEGATE,       // 대결 (대리결재)
    RETURN,         // 반송 (수정요청)
    HOLD,           // 보류
    COMMENT         // 의견첨부
}
