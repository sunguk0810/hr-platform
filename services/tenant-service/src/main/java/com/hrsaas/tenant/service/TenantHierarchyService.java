package com.hrsaas.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.tenant.domain.constant.DefaultTenantSettings;
import com.hrsaas.tenant.domain.dto.request.UpdateHierarchyRequest;
import com.hrsaas.tenant.domain.dto.response.HierarchyDto;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantHierarchyService {

    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    public HierarchyDto getHierarchy(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId));

        String json = tenant.getHierarchyData();
        if (json == null || json.isBlank()) {
            json = DefaultTenantSettings.DEFAULT_HIERARCHY;
        }

        try {
            return objectMapper.readValue(json, HierarchyDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse hierarchy data for tenant {}, using default", tenantId, e);
            try {
                return objectMapper.readValue(DefaultTenantSettings.DEFAULT_HIERARCHY, HierarchyDto.class);
            } catch (Exception ex) {
                throw new BusinessException("TNT_008", "계층 데이터 파싱 실패");
            }
        }
    }

    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public HierarchyDto updateHierarchy(UUID tenantId, UpdateHierarchyRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId));

        try {
            HierarchyDto dto = HierarchyDto.builder()
                .levels(request.getLevels())
                .build();
            tenant.setHierarchyData(objectMapper.writeValueAsString(dto));
        } catch (Exception e) {
            throw new BusinessException("TNT_008", "계층 데이터 직렬화 실패");
        }

        tenantRepository.save(tenant);
        log.info("Tenant hierarchy updated: tenantId={}", tenantId);

        return HierarchyDto.builder().levels(request.getLevels()).build();
    }
}
