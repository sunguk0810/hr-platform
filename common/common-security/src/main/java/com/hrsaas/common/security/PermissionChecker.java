package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import org.springframework.stereotype.Component;

/**
 * Service for checking user permissions.
 */
@Component
public class PermissionChecker {

    public void requireRole(String role) {
        if (!SecurityContextHolder.hasRole(role)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다: " + role);
        }
    }

    public void requireAnyRole(String... roles) {
        if (!SecurityContextHolder.hasAnyRole(roles)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다");
        }
    }

    public void requirePermission(String permission) {
        if (!SecurityContextHolder.hasPermission(permission)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다: " + permission);
        }
    }

    public void requireAnyPermission(String... permissions) {
        if (!SecurityContextHolder.hasAnyPermission(permissions)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다");
        }
    }

    public boolean hasRole(String role) {
        return SecurityContextHolder.hasRole(role);
    }

    public boolean hasPermission(String permission) {
        return SecurityContextHolder.hasPermission(permission);
    }

    public boolean isSuperAdmin() {
        return SecurityContextHolder.hasRole("ROLE_SUPER_ADMIN");
    }

    public boolean isTenantAdmin() {
        return SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_TENANT_ADMIN");
    }

    public boolean isHrAdmin() {
        return SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_TENANT_ADMIN", "ROLE_HR_ADMIN");
    }
}
