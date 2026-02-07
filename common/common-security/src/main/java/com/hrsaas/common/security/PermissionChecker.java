package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.security.client.EmployeeServiceClient;
import com.hrsaas.common.security.dto.EmployeeAffiliationDto;
import com.hrsaas.common.security.service.PermissionMappingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;
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
@Slf4j
@Component("permissionChecker")
public class PermissionChecker {

    private final PermissionMappingService permissionMappingService;
    private final Optional<EmployeeServiceClient> employeeServiceClient;

    @Autowired
    public PermissionChecker(
            PermissionMappingService permissionMappingService,
            @Autowired(required = false) EmployeeServiceClient employeeServiceClient) {
        this.permissionMappingService = permissionMappingService;
        this.employeeServiceClient = Optional.ofNullable(employeeServiceClient);
    }

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
     */
    public boolean canAccessEmployee(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        if (permissionMappingService.hasPermission(permissions, "employee:read")) {
            return true;
        }
        if (permissionMappingService.hasPermission(permissions, "employee:read:department")) {
            return isSameDepartment(employeeId);
        }
        if (permissionMappingService.hasPermission(permissions, "employee:read:team")) {
            return isSameTeam(employeeId);
        }
        if (permissionMappingService.hasPermission(permissions, "employee:read:self")) {
            return isSelf(employeeId);
        }

        return false;
    }

    /**
     * Check if the current user can modify the specified employee's data.
     */
    public boolean canModifyEmployee(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        if (permissionMappingService.hasPermission(permissions, "employee:write")) {
            return true;
        }
        if (permissionMappingService.hasPermission(permissions, "employee:write:self")) {
            return isSelf(employeeId);
        }

        return false;
    }

    /**
     * Check if the current user is the same as the specified employee.
     */
    public boolean isSelf(UUID employeeId) {
        UUID currentEmployeeId = SecurityContextHolder.getCurrentEmployeeId();
        return employeeId != null && employeeId.equals(currentEmployeeId);
    }

    /**
     * Check if the specified employee is in the same department as the current user.
     * Queries the employee service via Feign client for the target employee's department.
     */
    public boolean isSameDepartment(UUID employeeId) {
        UserContext context = SecurityContextHolder.getContext();
        if (context == null || context.getDepartmentId() == null) {
            return false;
        }

        EmployeeAffiliationDto affiliation = getEmployeeAffiliation(employeeId);
        if (affiliation == null || affiliation.departmentId() == null) {
            return false;
        }

        return context.getDepartmentId().equals(affiliation.departmentId());
    }

    /**
     * Check if the specified employee is in the same team as the current user.
     * Queries the employee service via Feign client for the target employee's team.
     */
    public boolean isSameTeam(UUID employeeId) {
        UserContext context = SecurityContextHolder.getContext();
        if (context == null || context.getTeamId() == null) {
            return false;
        }

        EmployeeAffiliationDto affiliation = getEmployeeAffiliation(employeeId);
        if (affiliation == null || affiliation.teamId() == null) {
            return false;
        }

        return context.getTeamId().equals(affiliation.teamId());
    }

    /**
     * Check if user can approve attendance for the specified employee.
     */
    public boolean canApproveAttendance(UUID employeeId) {
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        if (permissionMappingService.hasPermission(permissions, "attendance:approve")) {
            return true;
        }
        if (permissionMappingService.hasPermission(permissions, "attendance:approve:department")) {
            return isSameDepartment(employeeId);
        }
        if (permissionMappingService.hasPermission(permissions, "attendance:approve:team")) {
            return isSameTeam(employeeId);
        }

        return false;
    }

    private EmployeeAffiliationDto getEmployeeAffiliation(UUID employeeId) {
        if (employeeServiceClient.isEmpty()) {
            log.warn("EmployeeServiceClient not available - cannot check affiliation for employee: {}", employeeId);
            return null;
        }

        try {
            return employeeServiceClient.get().getAffiliation(employeeId);
        } catch (Exception e) {
            log.warn("Failed to fetch employee affiliation for: {}", employeeId, e);
            return null;
        }
    }
}
