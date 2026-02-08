package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendancePolicyData {

    private String workStartTime;
    private String workEndTime;
    private Integer standardWorkHours;
    private Boolean flexibleWorkEnabled;
    private Integer lateGraceMinutes;
    private Integer earlyLeaveGraceMinutes;
    private Boolean overtimeRequiresApproval;
    private Integer maxOvertimeHoursPerMonth;
}
