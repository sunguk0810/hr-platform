package com.hrsaas.appointment.domain.entity;

/**
 * 발령 유형
 */
public enum AppointmentType {
    /** 승진 */
    PROMOTION,
    /** 전보 (부서 이동) */
    TRANSFER,
    /** 보직 변경 (직책 변경) */
    POSITION_CHANGE,
    /** 직무 변경 */
    JOB_CHANGE,
    /** 휴직 */
    LEAVE_OF_ABSENCE,
    /** 복직 */
    REINSTATEMENT,
    /** 사직 */
    RESIGNATION,
    /** 정년퇴직 */
    RETIREMENT,
    /** 강등 */
    DEMOTION,
    /** 겸직 */
    CONCURRENT
}
