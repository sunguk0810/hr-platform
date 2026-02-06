package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.entity.ArbitraryApprovalRule;
import com.hrsaas.approval.repository.ArbitraryApprovalRuleRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ArbitraryApprovalRuleService {

    private final ArbitraryApprovalRuleRepository ruleRepository;

    @Transactional
    public ArbitraryApprovalRule create(ArbitraryApprovalRule rule) {
        return ruleRepository.save(rule);
    }

    public List<ArbitraryApprovalRule> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ruleRepository.findAllByTenantId(tenantId);
    }

    public Optional<ArbitraryApprovalRule> getById(UUID id) {
        return ruleRepository.findById(id);
    }

    @Transactional
    public ArbitraryApprovalRule update(UUID id, ArbitraryApprovalRule updated) {
        ArbitraryApprovalRule rule = ruleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));
        rule.setDocumentType(updated.getDocumentType());
        rule.setConditionType(updated.getConditionType());
        rule.setConditionOperator(updated.getConditionOperator());
        rule.setConditionValue(updated.getConditionValue());
        rule.setSkipToSequence(updated.getSkipToSequence());
        rule.setDescription(updated.getDescription());
        return ruleRepository.save(rule);
    }

    @Transactional
    public void delete(UUID id) {
        ruleRepository.deleteById(id);
    }

    /**
     * 전결 규칙 평가 - 매칭되는 규칙 중 가장 구체적인 것 반환
     */
    public Optional<ArbitraryApprovalRule> evaluateRules(String documentType, Map<String, String> conditions) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<ArbitraryApprovalRule> rules = ruleRepository.findActiveRules(tenantId, documentType);

        for (ArbitraryApprovalRule rule : rules) {
            String actualValue = conditions.get(rule.getConditionType());
            if (actualValue != null && rule.evaluate(actualValue)) {
                log.debug("Arbitrary rule matched: ruleId={}, conditionType={}, conditionValue={}, actual={}",
                    rule.getId(), rule.getConditionType(), rule.getConditionValue(), actualValue);
                return Optional.of(rule);
            }
        }
        return Optional.empty();
    }
}
