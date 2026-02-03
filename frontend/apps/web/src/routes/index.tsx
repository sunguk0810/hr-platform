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
 * Recursively render routes from configuration
 */
function renderRoutes(routes: RouteConfig[]) {
  return routes.map((route) => {
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
      >
        {route.children && renderRoutes(route.children)}
      </Route>
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
