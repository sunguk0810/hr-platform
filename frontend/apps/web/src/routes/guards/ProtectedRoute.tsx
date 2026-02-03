import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
}

/**
 * Unified guard for protected routes
 * Handles both role and permission checks
 * Should be used inside AuthGuard (assumes user is already authenticated)
 */
export function ProtectedRoute({
  children,
  permissions,
  roles,
}: ProtectedRouteProps) {
  const { hasAnyRole, hasAnyPermission } = useAuthStore();

  // Check role requirements
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/403" replace />;
  }

  // Check permission requirements
  if (permissions && permissions.length > 0 && !hasAnyPermission(permissions)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
