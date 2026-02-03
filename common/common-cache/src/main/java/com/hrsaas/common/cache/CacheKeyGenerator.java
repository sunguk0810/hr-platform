package com.hrsaas.common.cache;

import com.hrsaas.common.tenant.TenantContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility for generating tenant-aware cache keys.
 */
@Component
public class CacheKeyGenerator {

    private static final String SEPARATOR = ":";

    /**
     * Generate a tenant-scoped cache key.
     * Format: {prefix}:{tenantId}:{key}
     */
    public String generateKey(String prefix, String key) {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            return prefix + SEPARATOR + tenantId + SEPARATOR + key;
        }
        return prefix + SEPARATOR + key;
    }

    /**
     * Generate a tenant-scoped cache key with multiple key parts.
     * Format: {prefix}:{tenantId}:{part1}:{part2}:...
     */
    public String generateKey(String prefix, Object... keyParts) {
        StringBuilder sb = new StringBuilder(prefix);

        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            sb.append(SEPARATOR).append(tenantId);
        }

        for (Object part : keyParts) {
            sb.append(SEPARATOR).append(part);
        }

        return sb.toString();
    }

    /**
     * Generate a global (non-tenant-scoped) cache key.
     * Format: global:{prefix}:{key}
     */
    public String generateGlobalKey(String prefix, String key) {
        return "global" + SEPARATOR + prefix + SEPARATOR + key;
    }

    /**
     * Generate a user-scoped cache key.
     * Format: user:{userId}:{prefix}:{key}
     */
    public String generateUserKey(UUID userId, String prefix, String key) {
        return "user" + SEPARATOR + userId + SEPARATOR + prefix + SEPARATOR + key;
    }
}
