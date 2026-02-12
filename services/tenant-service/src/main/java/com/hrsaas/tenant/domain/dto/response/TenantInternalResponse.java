package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantInternalResponse {
    private UUID id;
    private String code;
    private String name;

    public static TenantInternalResponse from(Tenant tenant) {
        return TenantInternalResponse.builder()
                .id(tenant.getId())
                .code(tenant.getCode())
                .name(tenant.getName())
                .build();
    }
}
