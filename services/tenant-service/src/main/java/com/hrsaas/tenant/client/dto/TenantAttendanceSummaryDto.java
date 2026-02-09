package com.hrsaas.tenant.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantAttendanceSummaryDto {

    private BigDecimal attendanceRate;
    private BigDecimal previousAttendanceRate;
    private BigDecimal leaveUsageRate;
    private BigDecimal previousLeaveUsageRate;
    private BigDecimal avgOvertimeHours;
    private BigDecimal previousAvgOvertimeHours;
    private long onLeaveToday;
}
