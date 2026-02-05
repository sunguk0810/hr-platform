package com.hrsaas.common.security.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Service for mapping roles to permissions and checking permission access.
 * Based on PRD and SDD requirements.
 *
 * Permission format: {resource}:{action} or {resource}:{action}:{scope}
 * Examples:
 * - employee:read - read access to all employees
 * - employee:read:department - read access to department employees only
 * - employee:read:self - read access to own data only
 * - *:* - superadmin wildcard access
 */
@Service
public class PermissionMappingService {

    /**
     * Role to permissions mapping based on PRD requirements.
     */
    private static final Map<String, Set<String>> ROLE_PERMISSIONS = Map.ofEntries(
        // System Administrator - full access
        Map.entry("ROLE_SUPER_ADMIN", Set.of("*:*")),

        // Group HR Manager - cross-tenant access
        Map.entry("ROLE_GROUP_ADMIN", Set.of(
            "tenant:read", "tenant:write",
            "organization:read", "organization:write",
            "employee:read", "employee:write", "employee:read:sensitive",
            "attendance:read", "attendance:write",
            "approval:read", "approval:write", "approval:admin",
            "report:read", "report:write",
            "transfer:read", "transfer:write",
            "mdm:read", "mdm:write",
            "audit:read"
        )),

        // Tenant HR Administrator - tenant-wide access
        Map.entry("ROLE_TENANT_ADMIN", Set.of(
            "organization:read", "organization:write",
            "employee:read", "employee:write", "employee:read:sensitive",
            "attendance:read", "attendance:write",
            "approval:read", "approval:write", "approval:admin",
            "mdm:read", "mdm:write",
            "recruitment:read", "recruitment:write",
            "transfer:read", "transfer:write",
            "headcount:read", "headcount:write",
            "condolence:read", "condolence:write",
            "committee:read", "committee:write",
            "employee-card:read", "employee-card:write",
            "certificate:read", "certificate:write", "certificate:admin",
            "audit:read"
        )),

        // HR Manager - HR operations
        Map.entry("ROLE_HR_MANAGER", Set.of(
            "organization:read",
            "employee:read", "employee:write",
            "attendance:read", "attendance:write",
            "approval:read", "approval:write",
            "recruitment:read", "recruitment:write",
            "transfer:read", "transfer:write",
            "headcount:read", "headcount:write",
            "condolence:read", "condolence:write",
            "committee:read", "committee:write",
            "employee-card:read", "employee-card:write",
            "certificate:read", "certificate:write"
        )),

        // Department Manager - department scope
        Map.entry("ROLE_DEPT_MANAGER", Set.of(
            "organization:read",
            "employee:read:department",
            "attendance:read:department", "attendance:approve:department",
            "approval:read", "approval:approve",
            "condolence:read", "condolence:approve:department",
            "employee-card:read:department"
        )),

        // Team Leader - team scope
        Map.entry("ROLE_TEAM_LEADER", Set.of(
            "employee:read:team",
            "attendance:read:team", "attendance:approve:team",
            "approval:read:team", "approval:approve:team",
            "condolence:read:team",
            "employee-card:read:team"
        )),

        // Regular Employee - self scope
        Map.entry("ROLE_EMPLOYEE", Set.of(
            "employee:read:self", "employee:write:self",
            "attendance:read:self", "attendance:request",
            "approval:read:self", "approval:request",
            "certificate:read:self", "certificate:request",
            "condolence:read:self", "condolence:request",
            "employee-card:read:self"
        ))
    );

    /**
     * Get all permissions for the given roles, considering role hierarchy.
     *
     * @param roles Set of role names (with ROLE_ prefix)
     * @return Set of all permissions for the roles
     */
    public Set<String> getPermissionsForRoles(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Collections.emptySet();
        }

        Set<String> permissions = new HashSet<>();
        for (String role : roles) {
            Set<String> rolePerms = ROLE_PERMISSIONS.get(role);
            if (rolePerms != null) {
                permissions.addAll(rolePerms);
            }
        }
        return permissions;
    }

    /**
     * Check if user permissions satisfy the required permission.
     * Supports wildcard matching.
     *
     * @param userPermissions Set of user's permissions
     * @param requiredPermission The permission to check
     * @return true if permission is granted
     */
    public boolean hasPermission(Set<String> userPermissions, String requiredPermission) {
        if (userPermissions == null || userPermissions.isEmpty()) {
            return false;
        }

        // Superadmin wildcard
        if (userPermissions.contains("*:*")) {
            return true;
        }

        // Direct match
        if (userPermissions.contains(requiredPermission)) {
            return true;
        }

        // Wildcard matching: employee:* matches employee:read
        String[] parts = requiredPermission.split(":");
        if (parts.length >= 2) {
            // Check resource:* wildcard
            String resourceWildcard = parts[0] + ":*";
            if (userPermissions.contains(resourceWildcard)) {
                return true;
            }

            // Check broader scope: employee:read matches employee:read:self requirement
            // If user has employee:read, they can access employee:read:department or employee:read:self
            if (parts.length == 3) {
                String broaderPermission = parts[0] + ":" + parts[1];
                if (userPermissions.contains(broaderPermission)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if user permissions satisfy any of the required permissions.
     *
     * @param userPermissions Set of user's permissions
     * @param requiredPermissions Array of permissions (any match is sufficient)
     * @return true if any permission is granted
     */
    public boolean hasAnyPermission(Set<String> userPermissions, String... requiredPermissions) {
        for (String permission : requiredPermissions) {
            if (hasPermission(userPermissions, permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user permissions satisfy all required permissions.
     *
     * @param userPermissions Set of user's permissions
     * @param requiredPermissions Array of permissions (all must match)
     * @return true if all permissions are granted
     */
    public boolean hasAllPermissions(Set<String> userPermissions, String... requiredPermissions) {
        for (String permission : requiredPermissions) {
            if (!hasPermission(userPermissions, permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get the scope from a scoped permission.
     *
     * @param permission Permission string (e.g., "employee:read:department")
     * @return Scope string or null if not scoped
     */
    public String getPermissionScope(String permission) {
        String[] parts = permission.split(":");
        return parts.length >= 3 ? parts[2] : null;
    }

    /**
     * Check if permission has a specific scope.
     *
     * @param permission Permission to check
     * @param scope Expected scope (self, team, department)
     * @return true if permission has the specified scope
     */
    public boolean hasScope(String permission, String scope) {
        return scope.equals(getPermissionScope(permission));
    }
}
