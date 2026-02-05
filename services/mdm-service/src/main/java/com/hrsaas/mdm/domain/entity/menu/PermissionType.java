package com.hrsaas.mdm.domain.entity.menu;

/**
 * Types of permissions that can be assigned to menu items.
 */
public enum PermissionType {
    /**
     * Role-based permission (e.g., HR_MANAGER, TENANT_ADMIN)
     */
    ROLE,

    /**
     * Action-based permission (e.g., employee:read, attendance:write)
     */
    PERMISSION
}
