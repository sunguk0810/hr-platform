package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.TenantStatus;
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
public class TenantListItemResponse {

    private UUID id;
    private String code;
    private String name;
    private TenantStatus status;
    private Integer employeeCount;
    private String adminEmail;
    private Instant createdAt;
    private UUID parentId;
    private String parentName;
    private Integer level;
}
