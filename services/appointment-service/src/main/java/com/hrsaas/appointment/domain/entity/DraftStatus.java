package com.hrsaas.appointment.domain.entity;

/**
 * 발령안 상태
 */
public enum DraftStatus {
    /** 작성중 */
    DRAFT,
    /** 결재 대기 */
    PENDING_APPROVAL,
    /** 승인됨 */
    APPROVED,
    /** 반려됨 */
    REJECTED,
    /** 시행됨 */
    EXECUTED,
    /** 취소됨 */
    CANCELLED
}
