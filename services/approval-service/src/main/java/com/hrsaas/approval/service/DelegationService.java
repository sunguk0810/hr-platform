package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.dto.request.CreateDelegationRuleRequest;
import com.hrsaas.approval.domain.dto.response.DelegationRuleResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DelegationService {

    DelegationRuleResponse create(UUID delegatorId, String delegatorName, CreateDelegationRuleRequest request);

    DelegationRuleResponse getById(UUID id);

    List<DelegationRuleResponse> getByDelegatorId(UUID delegatorId);

    List<DelegationRuleResponse> getByDelegateId(UUID delegateId);

    List<DelegationRuleResponse> getAll();

    Optional<DelegationRuleResponse> getEffectiveRule(UUID delegatorId);

    void cancel(UUID id);

    void delete(UUID id);
}
