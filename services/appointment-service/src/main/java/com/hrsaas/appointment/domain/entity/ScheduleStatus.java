package com.hrsaas.appointment.domain.entity;

/**
 * 예약 발령 상태
 */
public enum ScheduleStatus {
    /** 예약됨 */
    SCHEDULED,
    /** 처리중 */
    PROCESSING,
    /** 완료 */
    COMPLETED,
    /** 실패 */
    FAILED,
    /** 취소됨 */
    CANCELLED
}
