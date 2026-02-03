package com.hrsaas.common.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Tenant information holder.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantInfo {

    private UUID tenantId;
    private String tenantCode;
    private String tenantName;
    private boolean active;
}
