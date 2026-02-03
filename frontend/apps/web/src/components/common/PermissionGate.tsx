import * as React from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // Role-based access
  roles?: string[];
  anyRole?: boolean;
  // Permission-based access
  permissions?: string[];
  anyPermission?: boolean;
  // Combined logic
  requireAll?: boolean;
}

export function PermissionGate({
  children,
  fallback = null,
  roles = [],
  anyRole = true,
  permissions = [],
  anyPermission = true,
  requireAll = false,
}: PermissionGateProps) {
  const { user, hasRole, hasPermission, hasAnyRole, hasAnyPermission } =
    useAuthStore();

  if (!user) {
    return <>{fallback}</>;
  }

  const checkRoles = (): boolean => {
    if (roles.length === 0) return true;
    return anyRole ? hasAnyRole(roles) : roles.every((role) => hasRole(role));
  };

  const checkPermissions = (): boolean => {
    if (permissions.length === 0) return true;
    return anyPermission
      ? hasAnyPermission(permissions)
      : permissions.every((perm) => hasPermission(perm));
  };

  const roleResult = checkRoles();
  const permissionResult = checkPermissions();

  const hasAccess = requireAll
    ? roleResult && permissionResult
    : roleResult || permissionResult || (roles.length === 0 && permissions.length === 0);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface UsePermissionOptions {
  roles?: string[];
  anyRole?: boolean;
  permissions?: string[];
  anyPermission?: boolean;
  requireAll?: boolean;
}

export function usePermission(options: UsePermissionOptions = {}): boolean {
  const { roles = [], anyRole = true, permissions = [], anyPermission = true, requireAll = false } =
    options;
  const { user, hasRole, hasPermission, hasAnyRole, hasAnyPermission } = useAuthStore();

  if (!user) return false;

  const checkRoles = (): boolean => {
    if (roles.length === 0) return true;
    return anyRole ? hasAnyRole(roles) : roles.every((role) => hasRole(role));
  };

  const checkPermissions = (): boolean => {
    if (permissions.length === 0) return true;
    return anyPermission
      ? hasAnyPermission(permissions)
      : permissions.every((perm) => hasPermission(perm));
  };

  const roleResult = checkRoles();
  const permissionResult = checkPermissions();

  return requireAll
    ? roleResult && permissionResult
    : roleResult || permissionResult || (roles.length === 0 && permissions.length === 0);
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export const PERMISSIONS = {
  // Employee
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_WRITE: 'employee:write',
  EMPLOYEE_DELETE: 'employee:delete',
  EMPLOYEE_READ_SENSITIVE: 'employee:read:sensitive',
  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_WRITE: 'attendance:write',
  ATTENDANCE_MANAGE: 'attendance:manage',
  // Leave
  LEAVE_READ: 'leave:read',
  LEAVE_WRITE: 'leave:write',
  LEAVE_APPROVE: 'leave:approve',
  // Approval
  APPROVAL_READ: 'approval:read',
  APPROVAL_WRITE: 'approval:write',
  APPROVAL_APPROVE: 'approval:approve',
  // Organization
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_WRITE: 'organization:write',
  // Tenant
  TENANT_READ: 'tenant:read',
  TENANT_WRITE: 'tenant:write',
  TENANT_MANAGE: 'tenant:manage',
  // MDM
  MDM_READ: 'mdm:read',
  MDM_WRITE: 'mdm:write',
  // Audit
  AUDIT_READ: 'audit:read',
} as const;
