package com.hrsaas.recruitment.domain.entity;

/**
 * 채용공고 상태
 */
public enum JobStatus {
    /**
     * 작성중
     */
    DRAFT,

    /**
     * 게시대기
     */
    PENDING,

    /**
     * 게시중
     */
    PUBLISHED,

    /**
     * 마감
     */
    CLOSED,

    /**
     * 취소
     */
    CANCELLED,

    /**
     * 완료 (채용 완료)
     */
    COMPLETED
}
