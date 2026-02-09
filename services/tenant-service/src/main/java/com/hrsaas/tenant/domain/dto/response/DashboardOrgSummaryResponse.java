package com.hrsaas.tenant.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOrgSummaryResponse {

    private long totalEmployees;
    private long activeEmployees;
    private long onLeaveEmployees;
    private long departmentCount;
    private long positionCount;
    private long newHiresThisMonth;
    private long resignedThisMonth;
}
