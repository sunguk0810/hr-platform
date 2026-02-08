package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityPolicyData {

    private Integer sessionTimeoutMinutes;
    private Integer maxSessions;
    private String mfaPolicy;
    private List<String> ipWhitelist;
    private Boolean loginNotificationEnabled;
    private Integer maxLoginAttempts;
    private Integer lockoutDurationMinutes;
}
