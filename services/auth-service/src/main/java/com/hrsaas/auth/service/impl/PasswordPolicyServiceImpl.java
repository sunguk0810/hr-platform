package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.client.TenantServiceClient;
import com.hrsaas.auth.domain.dto.PasswordPolicyDto;
import com.hrsaas.auth.service.PasswordPolicyService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordPolicyServiceImpl implements PasswordPolicyService {

    private final TenantServiceClient tenantServiceClient;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String CACHE_PREFIX = "tenant:password-policy:";
    private static final int CACHE_TTL_HOURS = 1;

    // System minimum requirements
    private static final int SYSTEM_MIN_LENGTH = 8;
    private static final int SYSTEM_MIN_CHAR_TYPES = 3;

    @Override
    public PasswordPolicyDto getPolicy(UUID tenantId) {
        try {
            ApiResponse<PasswordPolicyDto> response = tenantServiceClient.getPasswordPolicy(tenantId);
            if (response != null && response.getData() != null) {
                PasswordPolicyDto policy = response.getData();
                enforceSystemMinimum(policy);
                return policy;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch password policy for tenant: {}, using defaults", tenantId, e);
        }
        return getDefaultPolicy();
    }

    @Override
    public void validatePassword(String password, UUID tenantId) {
        PasswordPolicyDto policy = getPolicy(tenantId);
        List<String> violations = new ArrayList<>();

        if (password.length() < policy.getMinLength()) {
            violations.add("비밀번호는 최소 " + policy.getMinLength() + "자 이상이어야 합니다.");
        }
        if (policy.getMaxLength() > 0 && password.length() > policy.getMaxLength()) {
            violations.add("비밀번호는 최대 " + policy.getMaxLength() + "자 이하여야 합니다.");
        }

        int charTypes = 0;
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));

        if (hasUpper) charTypes++;
        if (hasLower) charTypes++;
        if (hasDigit) charTypes++;
        if (hasSpecial) charTypes++;

        if (policy.isRequireUppercase() && !hasUpper) {
            violations.add("대문자를 포함해야 합니다.");
        }
        if (policy.isRequireLowercase() && !hasLower) {
            violations.add("소문자를 포함해야 합니다.");
        }
        if (policy.isRequireDigit() && !hasDigit) {
            violations.add("숫자를 포함해야 합니다.");
        }
        if (policy.isRequireSpecialChar() && !hasSpecial) {
            violations.add("특수문자를 포함해야 합니다.");
        }
        if (charTypes < policy.getMinCharTypes()) {
            violations.add("최소 " + policy.getMinCharTypes() + "종류 이상의 문자를 조합해야 합니다.");
        }

        if (!violations.isEmpty()) {
            String message = String.join(" ", violations);
            throw new BusinessException("AUTH_011", message, HttpStatus.BAD_REQUEST);
        }
    }

    private void enforceSystemMinimum(PasswordPolicyDto policy) {
        if (policy.getMinLength() < SYSTEM_MIN_LENGTH) {
            policy.setMinLength(SYSTEM_MIN_LENGTH);
        }
        if (policy.getMinCharTypes() < SYSTEM_MIN_CHAR_TYPES) {
            policy.setMinCharTypes(SYSTEM_MIN_CHAR_TYPES);
        }
    }

    private PasswordPolicyDto getDefaultPolicy() {
        return PasswordPolicyDto.builder()
                .minLength(8)
                .maxLength(100)
                .requireUppercase(true)
                .requireLowercase(true)
                .requireDigit(true)
                .requireSpecialChar(true)
                .minCharTypes(3)
                .expiryDays(90)
                .historyCount(5)
                .build();
    }
}
