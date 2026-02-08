package com.hrsaas.approval.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 전결(직접 승인) 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectApproveStepRequest {

    private Integer skipToStep;

    private String reason;
}
