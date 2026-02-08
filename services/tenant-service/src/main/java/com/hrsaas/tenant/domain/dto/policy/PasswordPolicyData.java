package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordPolicyData {

    private Integer minLength;
    private Integer maxLength;
    private Boolean requireUppercase;
    private Boolean requireLowercase;
    private Boolean requireDigit;
    private Boolean requireSpecialChar;
    private Integer minCharTypes;
    private Integer expiryDays;
    private Integer historyCount;
    private Integer expiryWarningDays;
}
