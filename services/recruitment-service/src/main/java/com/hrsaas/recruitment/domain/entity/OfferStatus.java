package com.hrsaas.recruitment.domain.entity;

/**
 * 채용 제안 상태
 */
public enum OfferStatus {
    /**
     * 제안 준비중
     */
    DRAFT,

    /**
     * 내부 승인 대기
     */
    PENDING_APPROVAL,

    /**
     * 내부 승인 완료
     */
    APPROVED,

    /**
     * 지원자에게 전달됨
     */
    SENT,

    /**
     * 지원자 수락
     */
    ACCEPTED,

    /**
     * 지원자 거절
     */
    DECLINED,

    /**
     * 협상중
     */
    NEGOTIATING,

    /**
     * 만료
     */
    EXPIRED,

    /**
     * 취소
     */
    CANCELLED
}
