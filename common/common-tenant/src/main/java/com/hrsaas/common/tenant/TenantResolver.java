package com.hrsaas.common.tenant;

import java.util.UUID;

/**
 * Interface for resolving tenant information.
 */
public interface TenantResolver {

    /**
     * Resolve tenant info by tenant ID.
     */
    TenantInfo resolve(UUID tenantId);

    /**
     * Resolve tenant info by tenant code.
     */
    TenantInfo resolveByCode(String tenantCode);

    /**
     * Validate if tenant is active.
     */
    boolean isActive(UUID tenantId);
}
