package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.PasswordPolicyDto;

import java.util.UUID;

public interface PasswordPolicyService {

    PasswordPolicyDto getPolicy(UUID tenantId);

    void validatePassword(String password, UUID tenantId);
}
