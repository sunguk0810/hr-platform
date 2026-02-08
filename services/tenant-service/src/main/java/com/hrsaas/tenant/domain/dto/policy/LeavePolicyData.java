package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeavePolicyData {

    private Integer annualLeaveBaseCount;
    private Boolean carryOverEnabled;
    private Integer maxCarryOverDays;
    private Integer minLeaveNoticeHours;
    private Boolean halfDayLeaveEnabled;
    private Boolean hourlyLeaveEnabled;
    private Integer sickLeaveMaxDays;
}
