import { lazy } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileCheck,
  Settings,
  Bell,
  User,
  Shield,
  GitCompare,
} from 'lucide-react';
import type { RouteConfig, NavItem } from './types';

// Lazy load all pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MyInfoPage = lazy(() => import('@/features/my-info/pages/MyInfoPage'));
const EmployeeListPage = lazy(() => import('@/features/employee/pages/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('@/features/employee/pages/EmployeeDetailPage'));
const EmployeeCreatePage = lazy(() => import('@/features/employee/pages/EmployeeCreatePage'));
const OrganizationPage = lazy(() => import('@/features/organization/pages/OrganizationPage'));
const DepartmentListPage = lazy(() => import('@/features/organization/pages/DepartmentListPage'));
const GradeManagePage = lazy(() => import('@/features/organization/pages/GradeManagePage'));
const PositionManagePage = lazy(() => import('@/features/organization/pages/PositionManagePage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const LeaveRequestPage = lazy(() => import('@/features/attendance/pages/LeaveRequestPage'));
const MyLeavePage = lazy(() => import('@/features/attendance/pages/MyLeavePage'));
const LeaveCalendarPage = lazy(() => import('@/features/attendance/pages/LeaveCalendarPage'));
const OvertimePage = lazy(() => import('@/features/attendance/pages/OvertimePage'));
const ApprovalListPage = lazy(() => import('@/features/approval/pages/ApprovalListPage'));
const ApprovalCreatePage = lazy(() => import('@/features/approval/pages/ApprovalCreatePage'));
const ApprovalDetailPage = lazy(() => import('@/features/approval/pages/ApprovalDetailPage'));
const MyApprovalsPage = lazy(() => import('@/features/approval/pages/MyApprovalsPage'));
const DelegationPage = lazy(() => import('@/features/approval/pages/DelegationPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const NotificationCenterPage = lazy(() => import('@/features/notification/pages/NotificationCenterPage'));
const TenantComparisonPage = lazy(() => import('@/features/tenant/pages/TenantComparisonPage'));
const AuditLogPage = lazy(() => import('@/features/audit/pages/AuditLogPage'));

/**
 * Main application routes configuration
 * Single Source of Truth for all protected routes
 */
export const mainRoutes: RouteConfig[] = [
  {
    path: 'dashboard',
    title: '대시보드',
    icon: LayoutDashboard,
    element: DashboardPage,
    showInNav: true,
  },
  {
    path: 'my-info',
    title: '내 정보',
    icon: User,
    element: MyInfoPage,
    showInNav: true,
  },
  {
    path: 'employees',
    title: '인사정보',
    icon: Users,
    element: EmployeeListPage,
    permissions: ['employee:read'],
    showInNav: true,
    children: [
      {
        path: 'new',
        title: '직원 등록',
        element: EmployeeCreatePage,
        permissions: ['employee:write'],
      },
      {
        path: ':id',
        title: '직원 상세',
        element: EmployeeDetailPage,
        permissions: ['employee:read'],
      },
    ],
  },
  {
    path: 'organization',
    title: '조직관리',
    icon: Building2,
    element: OrganizationPage,
    permissions: ['organization:read'],
    showInNav: true,
    children: [
      {
        path: 'departments',
        title: '부서 목록',
        element: DepartmentListPage,
        permissions: ['organization:read'],
      },
      {
        path: 'grades',
        title: '직급 관리',
        element: GradeManagePage,
        permissions: ['organization:write'],
      },
      {
        path: 'positions',
        title: '직책 관리',
        element: PositionManagePage,
        permissions: ['organization:write'],
      },
    ],
  },
  {
    path: 'attendance',
    title: '근태/휴가',
    icon: Calendar,
    element: AttendancePage,
    showInNav: true,
    children: [
      {
        path: 'leave',
        title: '휴가 신청',
        element: LeaveRequestPage,
      },
      {
        path: 'my-leave',
        title: '내 휴가',
        element: MyLeavePage,
      },
      {
        path: 'leave/calendar',
        title: '휴가 캘린더',
        element: LeaveCalendarPage,
      },
      {
        path: 'overtime',
        title: '초과근무',
        element: OvertimePage,
      },
    ],
  },
  {
    path: 'approvals',
    title: '전자결재',
    icon: FileCheck,
    element: ApprovalListPage,
    showInNav: true,
    children: [
      {
        path: 'new',
        title: '결재 작성',
        element: ApprovalCreatePage,
      },
      {
        path: 'my',
        title: '내 결재',
        element: MyApprovalsPage,
      },
      {
        path: 'delegation',
        title: '결재 위임',
        element: DelegationPage,
      },
      {
        path: ':id',
        title: '결재 상세',
        element: ApprovalDetailPage,
      },
    ],
  },
  {
    path: 'notifications',
    title: '알림',
    icon: Bell,
    element: NotificationCenterPage,
    showInNav: true,
  },
  {
    path: 'settings',
    title: '설정',
    icon: Settings,
    element: SettingsPage,
    showInNav: true,
  },
  {
    path: 'tenants/compare',
    title: '테넌트 비교',
    icon: GitCompare,
    element: TenantComparisonPage,
    permissions: ['tenant:read'],
    roles: ['SYSTEM_ADMIN'],
    showInNav: false,
  },
  {
    path: 'audit',
    title: '감사 로그',
    icon: Shield,
    element: AuditLogPage,
    permissions: ['audit:read'],
    roles: ['SYSTEM_ADMIN', 'TENANT_ADMIN'],
    showInNav: true,
  },
];

/**
 * Generate navigation items from route configuration
 * Used by SidebarNav component
 */
export function getNavItems(): NavItem[] {
  return mainRoutes
    .filter((route): route is RouteConfig & { icon: NonNullable<RouteConfig['icon']> } =>
      route.showInNav === true && route.icon !== undefined
    )
    .map((route) => ({
      title: route.title,
      href: `/${route.path}`,
      icon: route.icon,
      permissions: route.permissions,
      roles: route.roles,
    }));
}
