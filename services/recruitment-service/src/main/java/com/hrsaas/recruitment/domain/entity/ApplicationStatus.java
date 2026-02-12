package com.hrsaas.recruitment.domain.entity;

/**
 * 지원 상태
 */
public enum ApplicationStatus {
    /**
     * 지원서 접수
     */
    SUBMITTED,

    /**
     * 서류 심사중
     */
    SCREENING,

    /**
     * 서류 통과
     */
    SCREENED,

    /**
     * 서류 탈락
     */
    SCREENING_REJECTED,

    /**
     * 면접 진행중
     */
    INTERVIEWING,

    /**
     * 면접 통과
     */
    INTERVIEW_PASSED,

    /**
     * 면접 탈락
     */
    INTERVIEW_REJECTED,

    /**
     * 최종 합격
     */
    OFFER_PENDING,

    /**
     * 채용 확정
     */
    HIRED,

    /**
     * 지원 취소
     */
    WITHDRAWN,

    /**
     * 불합격
     */
    REJECTED,

    /**
     * 면접 (일반)
     */
    INTERVIEW,

    /**
     * 합격 통보
     */
    OFFER
}
