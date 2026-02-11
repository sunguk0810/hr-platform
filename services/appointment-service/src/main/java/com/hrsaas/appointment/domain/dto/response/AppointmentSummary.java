package com.hrsaas.appointment.domain.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * 발령안 상태별 요약 정보
 */
@Data
@Builder
public class AppointmentSummary {

    /**
     * 임시저장 상태 발령안 수
     */
    private Long draftCount;

    /**
     * 결재 대기 중인 발령안 수
     */
    private Long pendingApprovalCount;

    /**
     * 승인된 발령안 수
     */
    private Long approvedCount;

    /**
     * 시행 완료된 발령안 수
     */
    private Long executedCount;
}
