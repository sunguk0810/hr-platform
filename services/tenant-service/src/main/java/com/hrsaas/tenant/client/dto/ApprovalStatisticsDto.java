package com.hrsaas.tenant.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStatisticsDto {

    private BigDecimal avgProcessingTimeHours;
    private BigDecimal previousAvgProcessingTimeHours;
}
