package com.hrsaas.common.entity;

import java.util.UUID;

/**
 * Holder for current tenant context.
 * This is a minimal implementation for the entity module.
 * The full implementation is in common-tenant module.
 */
public final class TenantContextHolder {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContextHolder() {
        // Utility class
    }

    public static void setCurrentTenant(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
