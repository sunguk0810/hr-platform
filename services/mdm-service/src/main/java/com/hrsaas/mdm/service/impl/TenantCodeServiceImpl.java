package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.UpdateTenantCodeRequest;
import com.hrsaas.mdm.domain.dto.response.TenantCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeTenantMapping;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeTenantMappingRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.TenantCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantCodeServiceImpl implements TenantCodeService {

    private final CodeTenantMappingRepository codeTenantMappingRepository;
    private final CommonCodeRepository commonCodeRepository;

    @Override
    @Cacheable(value = "mdm:tenantCode", key = "#codeId")
    public TenantCodeResponse getByCodeId(UUID codeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CodeTenantMapping mapping = getOrCreateMapping(tenantId, codeId);
        return TenantCodeResponse.from(mapping);
    }

    @Override
    public List<TenantCodeResponse> getByGroupCode(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CodeTenantMapping> mappings = codeTenantMappingRepository
            .findByTenantIdAndGroupCode(tenantId, groupCode);

        if (mappings.isEmpty()) {
            // No mappings exist, return original codes as tenant codes
            List<CommonCode> codes = commonCodeRepository.findByGroupCode(groupCode, tenantId);
            return codes.stream()
                .map(code -> createDefaultTenantCodeResponse(tenantId, code))
                .toList();
        }

        return mappings.stream()
            .map(TenantCodeResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:tenantCode", key = "#codeId")
    public TenantCodeResponse update(UUID codeId, UpdateTenantCodeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CodeTenantMapping mapping = getOrCreateMapping(tenantId, codeId);

        mapping.update(
            request.getCustomCodeName(),
            request.getCustomCodeNameEn(),
            request.getCustomDescription(),
            request.getCustomExtraValue1(),
            request.getCustomExtraValue2(),
            request.getCustomExtraValue3(),
            request.getCustomExtraJson(),
            request.getCustomSortOrder(),
            request.getHidden()
        );

        CodeTenantMapping saved = codeTenantMappingRepository.save(mapping);
        log.info("Tenant code updated: tenantId={}, codeId={}", tenantId, codeId);

        return TenantCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:tenantCode", key = "#codeId")
    public TenantCodeResponse hide(UUID codeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CodeTenantMapping mapping = getOrCreateMapping(tenantId, codeId);

        mapping.hide();
        CodeTenantMapping saved = codeTenantMappingRepository.save(mapping);
        log.info("Tenant code hidden: tenantId={}, codeId={}", tenantId, codeId);

        return TenantCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:tenantCode", key = "#codeId")
    public TenantCodeResponse show(UUID codeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CodeTenantMapping mapping = getOrCreateMapping(tenantId, codeId);

        mapping.show();
        CodeTenantMapping saved = codeTenantMappingRepository.save(mapping);
        log.info("Tenant code shown: tenantId={}, codeId={}", tenantId, codeId);

        return TenantCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:tenantCode", key = "#codeId")
    public void resetToDefault(UUID codeId) {
        UUID tenantId = TenantContext.getCurrentTenant();

        codeTenantMappingRepository.findByTenantIdAndCodeId(tenantId, codeId)
            .ifPresent(mapping -> {
                codeTenantMappingRepository.delete(mapping);
                log.info("Tenant code reset to default: tenantId={}, codeId={}", tenantId, codeId);
            });
    }

    private CodeTenantMapping getOrCreateMapping(UUID tenantId, UUID codeId) {
        return codeTenantMappingRepository.findByTenantIdAndCodeId(tenantId, codeId)
            .orElseGet(() -> {
                CommonCode code = commonCodeRepository.findById(codeId)
                    .orElseThrow(() -> new NotFoundException("MDM_002", "코드를 찾을 수 없습니다: " + codeId));

                return CodeTenantMapping.builder()
                    .tenantId(tenantId)
                    .commonCode(code)
                    .hidden(false)
                    .build();
            });
    }

    private TenantCodeResponse createDefaultTenantCodeResponse(UUID tenantId, CommonCode code) {
        return TenantCodeResponse.builder()
            .tenantId(tenantId)
            .codeId(code.getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .originalCodeName(code.getCodeName())
            .originalCodeNameEn(code.getCodeNameEn())
            .originalDescription(code.getDescription())
            .originalSortOrder(code.getSortOrder())
            .effectiveCodeName(code.getCodeName())
            .effectiveCodeNameEn(code.getCodeNameEn())
            .effectiveDescription(code.getDescription())
            .effectiveSortOrder(code.getSortOrder())
            .hidden(false)
            .active(code.isActive())
            .customized(false)
            .createdAt(code.getCreatedAt())
            .updatedAt(code.getUpdatedAt())
            .build();
    }
}
