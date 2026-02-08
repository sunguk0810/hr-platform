package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalPolicyData {

    private Integer escalationDays;
    private Integer maxApprovalLevels;
    private Boolean parallelApprovalEnabled;
    private Integer reminderIntervalHours;
    private Boolean autoApproveOnTimeout;
    private Integer autoApproveTimeoutDays;
}
