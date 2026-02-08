package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPolicyData {

    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private Boolean pushEnabled;
    private String quietHoursStart;
    private String quietHoursEnd;
    private Boolean digestEnabled;
    private String digestSchedule;
}
