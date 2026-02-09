package com.hrsaas.attendance.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingLeaveSummaryResponse {

    private long totalPending;
    private long urgentCount;
    private long thisWeekCount;
}
