package com.hrsaas.attendance.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeSummaryResponse {

    private String yearMonth;
    private long totalRequests;
    private long approvedRequests;
    private long pendingRequests;
    private BigDecimal totalHours;
    private BigDecimal approvedHours;
}
