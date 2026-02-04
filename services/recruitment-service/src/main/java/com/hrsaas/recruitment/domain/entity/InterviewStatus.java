package com.hrsaas.recruitment.domain.entity;

/**
 * 면접 상태
 */
public enum InterviewStatus {
    /**
     * 일정 조율중
     */
    SCHEDULING,

    /**
     * 일정 확정
     */
    SCHEDULED,

    /**
     * 면접 진행중
     */
    IN_PROGRESS,

    /**
     * 면접 완료
     */
    COMPLETED,

    /**
     * 불참
     */
    NO_SHOW,

    /**
     * 취소
     */
    CANCELLED,

    /**
     * 연기
     */
    POSTPONED
}
