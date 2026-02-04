package com.hrsaas.approval.service.impl;

import com.hrsaas.approval.domain.dto.request.CreateDelegationRuleRequest;
import com.hrsaas.approval.domain.dto.response.DelegationRuleResponse;
import com.hrsaas.approval.domain.entity.DelegationRule;
import com.hrsaas.approval.repository.DelegationRuleRepository;
import com.hrsaas.approval.service.DelegationService;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DelegationServiceImpl implements DelegationService {

    private final DelegationRuleRepository delegationRuleRepository;

    @Override
    @Transactional
    public DelegationRuleResponse create(UUID delegatorId, String delegatorName, CreateDelegationRuleRequest request) {
        DelegationRule rule = DelegationRule.builder()
            .delegatorId(delegatorId)
            .delegatorName(delegatorName)
            .delegateId(request.getDelegateId())
            .delegateName(request.getDelegateName())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .documentTypes(request.getDocumentTypes())
            .reason(request.getReason())
            .build();

        DelegationRule saved = delegationRuleRepository.save(rule);
        log.info("Delegation rule created: id={}, delegatorId={}, delegateId={}",
            saved.getId(), delegatorId, request.getDelegateId());

        return DelegationRuleResponse.from(saved);
    }

    @Override
    public DelegationRuleResponse getById(UUID id) {
        DelegationRule rule = findById(id);
        return DelegationRuleResponse.from(rule);
    }

    @Override
    public List<DelegationRuleResponse> getByDelegatorId(UUID delegatorId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<DelegationRule> rules = delegationRuleRepository.findByDelegatorId(tenantId, delegatorId);

        return rules.stream()
            .map(DelegationRuleResponse::from)
            .toList();
    }

    @Override
    public List<DelegationRuleResponse> getByDelegateId(UUID delegateId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<DelegationRule> rules = delegationRuleRepository.findByDelegateId(tenantId, delegateId);

        return rules.stream()
            .map(DelegationRuleResponse::from)
            .toList();
    }

    @Override
    public List<DelegationRuleResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<DelegationRule> rules = delegationRuleRepository.findAllByTenantId(tenantId);

        return rules.stream()
            .map(DelegationRuleResponse::from)
            .toList();
    }

    @Override
    public Optional<DelegationRuleResponse> getEffectiveRule(UUID delegatorId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return delegationRuleRepository.findEffectiveRule(tenantId, delegatorId, LocalDate.now())
            .map(DelegationRuleResponse::from);
    }

    @Override
    @Transactional
    public void cancel(UUID id) {
        DelegationRule rule = findById(id);
        rule.deactivate();
        delegationRuleRepository.save(rule);
        log.info("Delegation rule cancelled: id={}", id);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        DelegationRule rule = findById(id);
        delegationRuleRepository.delete(rule);
        log.info("Delegation rule deleted: id={}", id);
    }

    private DelegationRule findById(UUID id) {
        return delegationRuleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("APV_005", "대결 설정을 찾을 수 없습니다: " + id));
    }
}
