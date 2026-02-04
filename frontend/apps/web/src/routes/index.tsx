import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthGuard, ProtectedRoute } from './guards';
import { mainRoutes } from './config';
import type { RouteConfig } from './types';

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const LogoutPage = lazy(() => import('@/features/auth/pages/LogoutPage'));

// Error pages
const NotFoundPage = lazy(() => import('@/features/error/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/features/error/pages/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('@/features/error/pages/ServerErrorPage'));

/**
 * Flatten routes for rendering - handles nested routes by creating separate routes
 * This allows child routes to replace parent content rather than render inside it
 */
function flattenRoutes(routes: RouteConfig[], parentPath = ''): Array<{ path: string; element: RouteConfig['element']; permissions?: string[]; roles?: string[] }> {
  const result: Array<{ path: string; element: RouteConfig['element']; permissions?: string[]; roles?: string[] }> = [];

  for (const route of routes) {
    const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;

    // Add the current route
    result.push({
      path: fullPath,
      element: route.element,
      permissions: route.permissions,
      roles: route.roles,
    });

    // Recursively add children routes
    if (route.children) {
      result.push(...flattenRoutes(route.children, fullPath));
    }
  }

  return result;
}

/**
 * Render flattened routes
 */
function renderRoutes(routes: RouteConfig[]) {
  const flatRoutes = flattenRoutes(routes);

  return flatRoutes.map((route) => {
    const RouteElement = route.element;

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <ProtectedRoute permissions={route.permissions} roles={route.roles}>
            <RouteElement />
          </ProtectedRoute>
        }
      />
    );
  });
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />

      {/* Error pages */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        {renderRoutes(mainRoutes)}
      </Route>

      {/* Catch all - redirect to 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
