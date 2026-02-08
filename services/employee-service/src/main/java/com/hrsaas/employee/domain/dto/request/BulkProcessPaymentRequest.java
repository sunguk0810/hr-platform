package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 경조비 일괄 지급 처리 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkProcessPaymentRequest {

    @NotEmpty(message = "지급 대상 경조비 신청 ID 목록은 필수입니다")
    private List<UUID> condolenceIds;

    private LocalDate paidDate;
}
