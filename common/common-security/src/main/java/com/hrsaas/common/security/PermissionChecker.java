package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.security.service.PermissionMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

/**
 * Service for checking user permissions.
 * Bean name: permissionChecker (for use in SpEL expressions with @PreAuthorize)
 *
 * Role hierarchy (PRD based):
 * SUPER_ADMIN > GROUP_ADMIN > TENANT_ADMIN > HR_MANAGER > DEPT_MANAGER > TEAM_LEADER > EMPLOYEE
 *
 * Note: HR_ADMIN was renamed to HR_MANAGER to align with PRD terminology.
 */
@Component("permissionChecker")
@RequiredArgsConstructor
public class PermissionChecker {

    private final PermissionMappingService permissionMappingService;

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
        if (!hasPermission(permission)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다: " + permission);
        }
    }

    public void requireAnyPermission(String... permissions) {
        if (!hasAnyPermission(permissions)) {
            throw new ForbiddenException("AUTH_004", "필요한 권한이 없습니다");
        }
    }

    public boolean hasRole(String role) {
        return SecurityContextHolder.hasRole(role);
    }

    /**
     * Check if user has a specific permission.
     * Uses PermissionMappingService for wildcard matching support.
     */
    public boolean hasPermission(String permission) {
        Set<String> userPermissions = SecurityContextHolder.getCurrentPermissions();
        return permissionMappingService.hasPermission(userPermissions, permission);
    }

    /**
     * Check if user has any of the specified permissions.
     */
    public boolean hasAnyPermission(String... permissions) {
        Set<String> userPermissions = SecurityContextHolder.getCurrentPermissions();
        return permissionMappingService.hasAnyPermission(userPermissions, permissions);
    }

    public boolean isSuperAdmin() {
        return SecurityContextHolder.hasRole("ROLE_SUPER_ADMIN");
    }

    public boolean isGroupAdmin() {
        return SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_GROUP_ADMIN");
    }

    public boolean isTenantAdmin() {
        return SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_GROUP_ADMIN", "ROLE_TENANT_ADMIN");
    }

    /**
     * Check if user is HR Manager or above.
     * Note: HR_ADMIN renamed to HR_MANAGER per PRD.
     */
    public boolean isHrManager() {
        return SecurityContextHolder.hasAnyRole(
            "ROLE_SUPER_ADMIN", "ROLE_GROUP_ADMIN", "ROLE_TENANT_ADMIN", "ROLE_HR_MANAGER"
        );
    }

    /**
     * @deprecated Use {@link #isHrManager()} instead. Renamed per PRD.
     */
    @Deprecated
    public boolean isHrAdmin() {
        return isHrManager();
    }

    public boolean isDeptManager() {
        return SecurityContextHolder.hasAnyRole(
            "ROLE_SUPER_ADMIN", "ROLE_GROUP_ADMIN", "ROLE_TENANT_ADMIN",
            "ROLE_HR_MANAGER", "ROLE_DEPT_MANAGER"
        );
    }

    public boolean isTeamLeader() {
        return SecurityContextHolder.hasAnyRole(
            "ROLE_SUPER_ADMIN", "ROLE_GROUP_ADMIN", "ROLE_TENANT_ADMIN",
            "ROLE_HR_MANAGER", "ROLE_DEPT_MANAGER", "ROLE_TEAM_LEADER"
        );
    }

    /**
     * Check if the current user can access the specified employee's data.
     * Considers role-based scope (all, department, team, self).
     *
     * @param employeeId the employee ID to check access for
     * @return true if access is allowed, false otherwise
     */
    public boolean canAccessEmployee(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        // Full access permission
        if (permissionMappingService.hasPermission(permissions, "employee:read")) {
            return true;
        }

        // Department-based access
        if (permissionMappingService.hasPermission(permissions, "employee:read:department")) {
            return isSameDepartment(employeeId);
        }

        // Team-based access
        if (permissionMappingService.hasPermission(permissions, "employee:read:team")) {
            return isSameTeam(employeeId);
        }

        // Self-only access
        if (permissionMappingService.hasPermission(permissions, "employee:read:self")) {
            return isSelf(employeeId);
        }

        return false;
    }

    /**
     * Check if the current user can modify the specified employee's data.
     * Considers role-based scope (all, self).
     *
     * @param employeeId the employee ID to check modification access for
     * @return true if modification is allowed, false otherwise
     */
    public boolean canModifyEmployee(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        // Full write access
        if (permissionMappingService.hasPermission(permissions, "employee:write")) {
            return true;
        }

        // Self-only write access
        if (permissionMappingService.hasPermission(permissions, "employee:write:self")) {
            return isSelf(employeeId);
        }

        return false;
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

    /**
     * Check if the specified employee is in the same department as the current user.
     * TODO: Implement actual department check via employee service
     *
     * @param employeeId the employee ID to check
     * @return true if same department
     */
    public boolean isSameDepartment(UUID employeeId) {
        // Placeholder - should be implemented with actual department lookup
        UserContext context = SecurityContextHolder.getContext();
        if (context == null || context.getDepartmentId() == null) {
            return false;
        }
        // TODO: Call employee service to get employee's department and compare
        return true; // Temporary - should check actual department
    }

    /**
     * Check if the specified employee is in the same team as the current user.
     * TODO: Implement actual team check via employee service
     *
     * @param employeeId the employee ID to check
     * @return true if same team
     */
    public boolean isSameTeam(UUID employeeId) {
        // Placeholder - should be implemented with actual team lookup
        UserContext context = SecurityContextHolder.getContext();
        if (context == null || context.getTeamId() == null) {
            return false;
        }
        // TODO: Call employee service to get employee's team and compare
        return true; // Temporary - should check actual team
    }

    /**
     * Check if user can approve attendance for the specified employee.
     *
     * @param employeeId the employee to approve attendance for
     * @return true if approval is allowed
     */
    public boolean canApproveAttendance(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        // Full approval permission
        if (permissionMappingService.hasPermission(permissions, "attendance:approve")) {
            return true;
        }

        // Department scope
        if (permissionMappingService.hasPermission(permissions, "attendance:approve:department")) {
            return isSameDepartment(employeeId);
        }

        // Team scope
        if (permissionMappingService.hasPermission(permissions, "attendance:approve:team")) {
            return isSameTeam(employeeId);
        }

        return false;
    }
}
