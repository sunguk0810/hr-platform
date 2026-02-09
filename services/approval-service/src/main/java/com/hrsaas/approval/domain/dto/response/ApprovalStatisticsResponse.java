package com.hrsaas.approval.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStatisticsResponse {

    private BigDecimal avgProcessingTimeHours;
    private BigDecimal previousAvgProcessingTimeHours;
}
