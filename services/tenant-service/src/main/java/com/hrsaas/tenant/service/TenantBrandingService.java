package com.hrsaas.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.tenant.domain.dto.request.UpdateBrandingRequest;
import com.hrsaas.tenant.domain.dto.response.BrandingDto;
import com.hrsaas.tenant.domain.dto.response.TenantDetailResponse;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantBrandingService {

    private final TenantRepository tenantRepository;
    private final TenantDetailAssembler detailAssembler;
    private final ObjectMapper objectMapper;

    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantDetailResponse updateBranding(UUID tenantId, UpdateBrandingRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId));

        try {
            BrandingDto dto = BrandingDto.builder()
                .primaryColor(request.getPrimaryColor())
                .secondaryColor(request.getSecondaryColor())
                .logoUrl(request.getLogoUrl())
                .faviconUrl(request.getFaviconUrl())
                .loginBackgroundUrl(request.getLoginBackgroundUrl())
                .build();
            tenant.setBrandingData(objectMapper.writeValueAsString(dto));
        } catch (Exception e) {
            throw new BusinessException("TNT_007", "브랜딩 데이터 직렬화 실패");
        }

        Tenant saved = tenantRepository.save(tenant);
        log.info("Tenant branding updated: tenantId={}", tenantId);
        return detailAssembler.toDetailResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public Map<String, String> uploadBrandingImage(UUID tenantId, String type, MultipartFile file) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId);
        }

        // MVP: Generate a placeholder URL. Real implementation would integrate with file-service.
        String imageUrl = "/api/v1/files/tenants/" + tenantId + "/branding/" + type + "/" + file.getOriginalFilename();
        log.info("Tenant branding image uploaded (MVP): tenantId={}, type={}, url={}", tenantId, type, imageUrl);

        return Map.of("url", imageUrl, "type", type);
    }
}
