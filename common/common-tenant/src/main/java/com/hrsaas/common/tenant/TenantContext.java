package com.hrsaas.common.tenant;

import java.util.UUID;

/**
 * Thread-local storage for tenant context.
 */
public final class TenantContext {

    private static final ThreadLocal<TenantInfo> CONTEXT = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    public static void setCurrentTenant(UUID tenantId) {
        TenantInfo info = getOrCreateInfo();
        info.setTenantId(tenantId);
    }

    public static UUID getCurrentTenant() {
        TenantInfo info = CONTEXT.get();
        return info != null ? info.getTenantId() : null;
    }

    public static void setTenantCode(String tenantCode) {
        TenantInfo info = getOrCreateInfo();
        info.setTenantCode(tenantCode);
    }

    public static String getTenantCode() {
        TenantInfo info = CONTEXT.get();
        return info != null ? info.getTenantCode() : null;
    }

    public static void setTenantName(String tenantName) {
        TenantInfo info = getOrCreateInfo();
        info.setTenantName(tenantName);
    }

    public static String getTenantName() {
        TenantInfo info = CONTEXT.get();
        return info != null ? info.getTenantName() : null;
    }

    public static TenantInfo getTenantInfo() {
        return CONTEXT.get();
    }

    public static void setTenantInfo(TenantInfo info) {
        CONTEXT.set(info);
    }

    public static void clear() {
        CONTEXT.remove();
    }

    private static TenantInfo getOrCreateInfo() {
        TenantInfo info = CONTEXT.get();
        if (info == null) {
            info = new TenantInfo();
            CONTEXT.set(info);
        }
        return info;
    }

    public static boolean hasTenant() {
        return getCurrentTenant() != null;
    }
}
