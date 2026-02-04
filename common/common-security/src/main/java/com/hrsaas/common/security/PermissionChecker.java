package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Service for checking user permissions.
 * Bean name: permissionChecker (for use in SpEL expressions with @PreAuthorize)
 */
@Component("permissionChecker")
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

    /**
     * Check if the current user can access the specified employee's data.
     * Returns true if the user is an HR admin or if they are accessing their own data.
     *
     * @param employeeId the employee ID to check access for
     * @return true if access is allowed, false otherwise
     */
    public boolean canAccessEmployee(UUID employeeId) {
        // HR admins and above can access any employee
        if (isHrAdmin()) {
            return true;
        }
        // Regular employees can only access their own data
        UUID currentEmployeeId = SecurityContextHolder.getCurrentEmployeeId();
        return employeeId != null && employeeId.equals(currentEmployeeId);
    }

    /**
     * Check if the current user can modify the specified employee's data.
     * Returns true if the user is an HR admin or if they are modifying their own limited data.
     *
     * @param employeeId the employee ID to check modification access for
     * @return true if modification is allowed, false otherwise
     */
    public boolean canModifyEmployee(UUID employeeId) {
        // HR admins and above can modify any employee
        if (isHrAdmin()) {
            return true;
        }
        // Regular employees can modify their own limited data
        UUID currentEmployeeId = SecurityContextHolder.getCurrentEmployeeId();
        return employeeId != null && employeeId.equals(currentEmployeeId);
    }

    /**
     * Check if the current user is the same as the specified employee.
     *
     * @param employeeId the employee ID to compare
     * @return true if it's the current user's own employee ID
     */
    public boolean isSelf(UUID employeeId) {
        UUID currentEmployeeId = SecurityContextHolder.getCurrentEmployeeId();
        return employeeId != null && employeeId.equals(currentEmployeeId);
    }
}
