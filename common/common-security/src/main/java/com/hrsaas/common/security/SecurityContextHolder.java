package com.hrsaas.common.security;

import java.util.Set;
import java.util.UUID;

/**
 * Thread-local storage for security context.
 */
public final class SecurityContextHolder {

    private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

    private SecurityContextHolder() {
        // Utility class
    }

    public static void setContext(UserContext context) {
        CONTEXT.set(context);
    }

    public static UserContext getContext() {
        return CONTEXT.get();
    }

    public static UUID getCurrentUserId() {
        UserContext context = CONTEXT.get();
        return context != null ? context.getUserId() : null;
    }

    public static UUID getCurrentTenantId() {
        UserContext context = CONTEXT.get();
        return context != null ? context.getTenantId() : null;
    }

    public static UUID getCurrentEmployeeId() {
        UserContext context = CONTEXT.get();
        return context != null ? context.getEmployeeId() : null;
    }

    public static Set<String> getCurrentRoles() {
        UserContext context = CONTEXT.get();
        return context != null ? context.getRoles() : Set.of();
    }

    public static Set<String> getCurrentPermissions() {
        UserContext context = CONTEXT.get();
        return context != null ? context.getPermissions() : Set.of();
    }

    public static boolean hasRole(String role) {
        return getCurrentRoles().contains(role);
    }

    public static boolean hasPermission(String permission) {
        return getCurrentPermissions().contains(permission);
    }

    public static boolean hasAnyRole(String... roles) {
        Set<String> currentRoles = getCurrentRoles();
        for (String role : roles) {
            if (currentRoles.contains(role)) {
                return true;
            }
        }
        return false;
    }

    public static boolean hasAnyPermission(String... permissions) {
        Set<String> currentPermissions = getCurrentPermissions();
        for (String permission : permissions) {
            if (currentPermissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static boolean isAuthenticated() {
        return CONTEXT.get() != null;
    }
}
