package com.hrsaas.approval.domain.entity;

public enum ApprovalActionType {
    APPROVE,        // 승인
    REJECT,         // 반려
    AGREE,          // 합의 (승인권 없이 의견만 제시)
    DELEGATE,       // 대결 (대리결재)
    RETURN,         // 반송 (수정요청)
    HOLD,           // 보류
    COMMENT         // 의견첨부
}
