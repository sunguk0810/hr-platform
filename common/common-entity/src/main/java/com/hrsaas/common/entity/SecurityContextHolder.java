package com.hrsaas.common.entity;

import java.util.UUID;

/**
 * Holder for current security context.
 * This is a minimal implementation for the entity module.
 * The full implementation is in common-security module.
 */
public final class SecurityContextHolder {

    private static final ThreadLocal<UUID> CURRENT_USER = new ThreadLocal<>();

    private SecurityContextHolder() {
        // Utility class
    }

    public static void setCurrentUserId(UUID userId) {
        CURRENT_USER.set(userId);
    }

    public static UUID getCurrentUserId() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
