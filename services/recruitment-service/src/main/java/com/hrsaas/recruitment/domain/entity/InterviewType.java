package com.hrsaas.recruitment.domain.entity;

/**
 * 면접 유형
 */
public enum InterviewType {
    /**
     * 1차 면접 (실무자 면접)
     */
    FIRST_ROUND,

    /**
     * 2차 면접 (임원 면접)
     */
    SECOND_ROUND,

    /**
     * 최종 면접
     */
    FINAL_ROUND,

    /**
     * 기술 면접
     */
    TECHNICAL,

    /**
     * 인성 면접
     */
    PERSONALITY,

    /**
     * 프레젠테이션 면접
     */
    PRESENTATION,

    /**
     * 그룹 면접
     */
    GROUP,

    /**
     * 화상 면접
     */
    VIDEO,

    /**
     * 전화 면접
     */
    PHONE
}
