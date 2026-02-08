package com.hrsaas.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.tenant.domain.dto.policy.*;
import com.hrsaas.tenant.domain.entity.PolicyType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PolicyDataValidator {

    private final ObjectMapper objectMapper;

    public void validate(PolicyType type, String policyData) {
        if (policyData == null || policyData.isBlank()) {
            throw new BusinessException("TNT_005", "정책 데이터가 비어있습니다.");
        }

        try {
            switch (type) {
                case PASSWORD -> validatePassword(policyData);
                case ATTENDANCE -> parse(policyData, AttendancePolicyData.class);
                case LEAVE -> parse(policyData, LeavePolicyData.class);
                case APPROVAL -> parse(policyData, ApprovalPolicyData.class);
                case SECURITY -> parse(policyData, SecurityPolicyData.class);
                case NOTIFICATION -> parse(policyData, NotificationPolicyData.class);
                case ORGANIZATION -> parse(policyData, OrganizationPolicyData.class);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Policy data parsing failed: type={}, error={}", type, e.getMessage());
            throw new BusinessException("TNT_005", "정책 데이터 형식이 올바르지 않습니다: " + type);
        }
    }

    private void validatePassword(String policyData) throws Exception {
        PasswordPolicyData data = parse(policyData, PasswordPolicyData.class);

        if (data.getMinLength() != null && data.getMinLength() < 8) {
            throw new BusinessException("TNT_008", "비밀번호 최소 길이는 8자 이상이어야 합니다.");
        }
        if (data.getMinCharTypes() != null && data.getMinCharTypes() < 3) {
            throw new BusinessException("TNT_008", "비밀번호 최소 문자 유형은 3가지 이상이어야 합니다.");
        }
    }

    private <T> T parse(String json, Class<T> clazz) throws Exception {
        return objectMapper.readValue(json, clazz);
    }
}
