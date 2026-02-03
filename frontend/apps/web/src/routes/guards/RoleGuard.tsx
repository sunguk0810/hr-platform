import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedPermissions?: string[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  allowedPermissions,
  fallback,
  redirectTo = '/403',
}: RoleGuardProps) {
  const { hasAnyRole, hasAnyPermission } = useAuthStore();

  const hasRequiredRole = !allowedRoles || allowedRoles.length === 0 || hasAnyRole(allowedRoles);
  const hasRequiredPermission = !allowedPermissions || allowedPermissions.length === 0 || hasAnyPermission(allowedPermissions);

  if (!hasRequiredRole || !hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
