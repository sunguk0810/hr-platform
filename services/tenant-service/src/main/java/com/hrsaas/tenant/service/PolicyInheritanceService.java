package com.hrsaas.tenant.service;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.tenant.domain.dto.request.InheritPoliciesRequest;
import com.hrsaas.tenant.domain.entity.*;
import com.hrsaas.tenant.repository.PolicyChangeHistoryRepository;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyInheritanceService {

    private final TenantRepository tenantRepository;
    private final TenantPolicyRepository tenantPolicyRepository;
    private final PolicyChangeHistoryRepository policyChangeHistoryRepository;

    @Transactional
    @CacheEvict(value = {CacheNames.TENANT, CacheNames.TENANT_POLICY}, allEntries = true)
    public void inheritPolicies(UUID parentId, InheritPoliciesRequest request) {
        Tenant parent = tenantRepository.findById(parentId)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + parentId));

        if (!parent.isGroup()) {
            throw new BusinessException("TNT_009", "그룹 테넌트만 정책을 상속할 수 있습니다.");
        }

        List<Tenant> subsidiaries = tenantRepository.findByParentId(parentId);
        List<UUID> subsidiaryIds = subsidiaries.stream().map(Tenant::getId).toList();

        for (UUID childId : request.getChildIds()) {
            if (!subsidiaryIds.contains(childId)) {
                throw new BusinessException("TNT_010", "자회사가 아닌 테넌트에는 정책을 상속할 수 없습니다: " + childId);
            }
        }

        UserContext user = SecurityContextHolder.getCurrentUser();
        String changedBy = user != null ? String.valueOf(user.getUserId()) : null;
        String changedByName = user != null ? user.getUsername() : null;

        for (String policyTypeStr : request.getPolicyTypes()) {
            PolicyType policyType;
            try {
                policyType = PolicyType.valueOf(policyTypeStr);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown policy type: {}", policyTypeStr);
                continue;
            }

            TenantPolicy parentPolicy = tenantPolicyRepository.findByTenantIdAndPolicyType(parentId, policyType)
                .orElse(null);

            if (parentPolicy == null) {
                log.warn("Parent tenant has no policy: parentId={}, policyType={}", parentId, policyType);
                continue;
            }

            for (UUID childId : request.getChildIds()) {
                String beforeValue = tenantPolicyRepository.findByTenantIdAndPolicyType(childId, policyType)
                    .map(TenantPolicy::getPolicyData)
                    .orElse(null);

                TenantPolicy childPolicy = tenantPolicyRepository.findByTenantIdAndPolicyType(childId, policyType)
                    .orElseGet(() -> TenantPolicy.builder()
                        .tenantId(childId)
                        .policyType(policyType)
                        .build());

                childPolicy.updatePolicyData(parentPolicy.getPolicyData());
                tenantPolicyRepository.save(childPolicy);

                // Record history
                policyChangeHistoryRepository.save(PolicyChangeHistory.builder()
                    .tenantId(childId)
                    .policyType(policyType.name())
                    .action("INHERIT")
                    .beforeValue(beforeValue)
                    .afterValue(parentPolicy.getPolicyData())
                    .changedBy(changedBy)
                    .changedByName(changedByName)
                    .sourceId(parentId)
                    .sourceName(parent.getName())
                    .build());
            }
        }

        log.info("Policies inherited: parentId={}, childIds={}, policyTypes={}",
            parentId, request.getChildIds(), request.getPolicyTypes());
    }
}
