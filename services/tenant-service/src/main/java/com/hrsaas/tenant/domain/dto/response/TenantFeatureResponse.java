package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.TenantFeature;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantFeatureResponse {

    private UUID id;
    private UUID tenantId;
    private String featureCode;
    private Boolean isEnabled;
    private String config;
    private Instant createdAt;
    private Instant updatedAt;

    public static TenantFeatureResponse from(TenantFeature feature) {
        return TenantFeatureResponse.builder()
            .id(feature.getId())
            .tenantId(feature.getTenantId())
            .featureCode(feature.getFeatureCode())
            .isEnabled(feature.getIsEnabled())
            .config(feature.getConfig())
            .createdAt(feature.getCreatedAt())
            .updatedAt(feature.getUpdatedAt())
            .build();
    }
}
