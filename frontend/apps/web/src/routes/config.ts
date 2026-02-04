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
  Building,
  HelpCircle,
  Megaphone,
  Database,
  UserCog,
  FileText,
  Briefcase,
  ArrowLeftRight,
  UsersRound,
  Heart,
  Users2,
  CreditCard,
} from 'lucide-react';
import type { RouteConfig, NavItem } from './types';

// Lazy load all pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MyInfoPage = lazy(() => import('@/features/my-info/pages/MyInfoPage'));
const EmployeeListPage = lazy(() => import('@/features/employee/pages/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('@/features/employee/pages/EmployeeDetailPage'));
const EmployeeCreatePage = lazy(() => import('@/features/employee/pages/EmployeeCreatePage'));
const RecordCardPage = lazy(() => import('@/features/employee/pages/RecordCardPage'));
const OrganizationPage = lazy(() => import('@/features/organization/pages/OrganizationPage'));
const DepartmentListPage = lazy(() => import('@/features/organization/pages/DepartmentListPage'));
const GradeManagePage = lazy(() => import('@/features/organization/pages/GradeManagePage'));
const PositionManagePage = lazy(() => import('@/features/organization/pages/PositionManagePage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const LeaveRequestPage = lazy(() => import('@/features/attendance/pages/LeaveRequestPage'));
const MyLeavePage = lazy(() => import('@/features/attendance/pages/MyLeavePage'));
const LeaveCalendarPage = lazy(() => import('@/features/attendance/pages/LeaveCalendarPage'));
const OvertimePage = lazy(() => import('@/features/attendance/pages/OvertimePage'));
const WorkHourMonitoringPage = lazy(() => import('@/features/attendance/pages/WorkHourMonitoringPage'));
const LeaveApprovalPage = lazy(() => import('@/features/attendance/pages/LeaveApprovalPage'));
const ApprovalListPage = lazy(() => import('@/features/approval/pages/ApprovalListPage'));
const ApprovalCreatePage = lazy(() => import('@/features/approval/pages/ApprovalCreatePage'));
const ApprovalDetailPage = lazy(() => import('@/features/approval/pages/ApprovalDetailPage'));
const MyApprovalsPage = lazy(() => import('@/features/approval/pages/MyApprovalsPage'));
const DelegationPage = lazy(() => import('@/features/approval/pages/DelegationPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const NotificationCenterPage = lazy(() => import('@/features/notification/pages/NotificationCenterPage'));
const TenantComparisonPage = lazy(() => import('@/features/tenant/pages/TenantComparisonPage'));
const TenantListPage = lazy(() => import('@/features/tenant/pages/TenantListPage'));
const TenantDetailPage = lazy(() => import('@/features/tenant/pages/TenantDetailPage'));
const AuditLogPage = lazy(() => import('@/features/audit/pages/AuditLogPage'));
const HelpGuidePage = lazy(() => import('@/features/help/pages/HelpGuidePage'));
const HelpFAQPage = lazy(() => import('@/features/help/pages/HelpFAQPage'));
const HelpContactPage = lazy(() => import('@/features/help/pages/HelpContactPage'));
const AnnouncementListPage = lazy(() => import('@/features/announcement/pages/AnnouncementListPage'));
const AnnouncementDetailPage = lazy(() => import('@/features/announcement/pages/AnnouncementDetailPage'));
const CodeGroupPage = lazy(() => import('@/features/mdm/pages/CodeGroupPage'));
const CommonCodePage = lazy(() => import('@/features/mdm/pages/CommonCodePage'));
const TenantCodePage = lazy(() => import('@/features/mdm/pages/TenantCodePage'));
const AppointmentListPage = lazy(() => import('@/features/appointment/pages/AppointmentListPage'));
const AppointmentDetailPage = lazy(() => import('@/features/appointment/pages/AppointmentDetailPage'));
const AppointmentCreatePage = lazy(() => import('@/features/appointment/pages/AppointmentCreatePage'));
const MyCertificatesPage = lazy(() => import('@/features/certificate/pages/MyCertificatesPage'));
const CertificateRequestPage = lazy(() => import('@/features/certificate/pages/CertificateRequestPage'));
const CertificateIssueHistoryPage = lazy(() => import('@/features/certificate/pages/CertificateIssueHistoryPage'));
const CertificateVerifyPage = lazy(() => import('@/features/certificate/pages/CertificateVerifyPage'));
const JobPostingListPage = lazy(() => import('@/features/recruitment/pages/JobPostingListPage'));
const JobPostingDetailPage = lazy(() => import('@/features/recruitment/pages/JobPostingDetailPage'));
const JobPostingCreatePage = lazy(() => import('@/features/recruitment/pages/JobPostingCreatePage'));
const ApplicationListPage = lazy(() => import('@/features/recruitment/pages/ApplicationListPage'));
const ApplicationDetailPage = lazy(() => import('@/features/recruitment/pages/ApplicationDetailPage'));
const InterviewListPage = lazy(() => import('@/features/recruitment/pages/InterviewListPage'));
const MyInterviewsPage = lazy(() => import('@/features/recruitment/pages/MyInterviewsPage'));
const ApprovalTemplatesPage = lazy(() => import('@/features/approval/pages/ApprovalTemplatesPage'));
const ApprovalTemplateEditPage = lazy(() => import('@/features/approval/pages/ApprovalTemplateEditPage'));
const OrgHistoryPage = lazy(() => import('@/features/organization/pages/OrgHistoryPage'));
const PrivacyAccessLogPage = lazy(() => import('@/features/employee/pages/PrivacyAccessLogPage'));
const DelegationRulesPage = lazy(() => import('@/features/approval/pages/DelegationRulesPage'));
const TransferListPage = lazy(() => import('@/features/transfer/pages/TransferListPage'));
const TransferRequestPage = lazy(() => import('@/features/transfer/pages/TransferRequestPage'));
const TransferDetailPage = lazy(() => import('@/features/transfer/pages/TransferDetailPage'));
const HeadcountPage = lazy(() => import('@/features/headcount/pages/HeadcountPage'));
const HeadcountRequestsPage = lazy(() => import('@/features/headcount/pages/HeadcountRequestsPage'));
const CondolenceListPage = lazy(() => import('@/features/condolence/pages/CondolenceListPage'));
const CommitteeListPage = lazy(() => import('@/features/committee/pages/CommitteeListPage'));
const EmployeeCardListPage = lazy(() => import('@/features/employee-card/pages/EmployeeCardListPage'));

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
        showInNav: false, // 작성 페이지는 숨김
      },
      {
        path: ':id',
        title: '직원 상세',
        element: EmployeeDetailPage,
        permissions: ['employee:read'],
        showInNav: false, // 동적 라우트는 숨김
      },
      {
        path: ':id/record-card',
        title: '인사기록카드',
        element: RecordCardPage,
        permissions: ['employee:read'],
        showInNav: false,
      },
    ],
  },
  {
    path: 'organization',
    title: '조직관리',
    icon: Building2,
    element: OrganizationPage,
    // 조직도 조회는 모든 사용자 허용 (권한 제거)
    showInNav: true,
    children: [
      {
        path: 'departments',
        title: '부서 목록',
        element: DepartmentListPage,
        showInNav: true,
      },
      {
        path: 'grades',
        title: '직급 관리',
        element: GradeManagePage,
        permissions: ['organization:write'],
        showInNav: true,
      },
      {
        path: 'positions',
        title: '직책 관리',
        element: PositionManagePage,
        permissions: ['organization:write'],
        showInNav: true,
      },
      {
        path: 'history',
        title: '변경 이력',
        element: OrgHistoryPage,
        showInNav: true,
      },
    ],
  },
  {
    path: 'appointments',
    title: '발령관리',
    icon: UserCog,
    element: AppointmentListPage,
    // permissions: ['appointment:read'], // 임시로 권한 체크 제거
    showInNav: true,
    children: [
      {
        path: 'new',
        title: '발령안 작성',
        element: AppointmentCreatePage,
        permissions: ['appointment:write'],
        showInNav: true,
      },
      {
        path: ':id',
        title: '발령안 상세',
        element: AppointmentDetailPage,
        permissions: ['appointment:read'],
        showInNav: false,
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
        showInNav: true,
      },
      {
        path: 'my-leave',
        title: '내 휴가',
        element: MyLeavePage,
        showInNav: true,
      },
      {
        path: 'leave/calendar',
        title: '휴가 캘린더',
        element: LeaveCalendarPage,
        showInNav: true,
      },
      {
        path: 'leave/approval',
        title: '휴가 승인',
        element: LeaveApprovalPage,
        permissions: ['attendance:approve'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'DEPT_MANAGER', 'TEAM_LEADER'],
        showInNav: true,
      },
      {
        path: 'overtime',
        title: '초과근무',
        element: OvertimePage,
        showInNav: true,
      },
      {
        path: 'work-hours',
        title: '52시간 모니터링',
        element: WorkHourMonitoringPage,
        permissions: ['attendance:read'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'DEPT_MANAGER', 'TEAM_LEADER'],
        showInNav: true,
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
        showInNav: true,
      },
      {
        path: 'my',
        title: '내 결재',
        element: MyApprovalsPage,
        showInNav: true,
      },
      {
        path: 'delegation',
        title: '결재 위임',
        element: DelegationPage,
        showInNav: true,
      },
      {
        path: ':id',
        title: '결재 상세',
        element: ApprovalDetailPage,
        showInNav: false, // 동적 라우트는 숨김
      },
    ],
  },
  {
    path: 'certificates',
    title: '증명서',
    icon: FileText,
    element: MyCertificatesPage,
    showInNav: true,
    children: [
      {
        path: 'request',
        title: '증명서 신청',
        element: CertificateRequestPage,
        showInNav: true,
      },
      {
        path: 'issued',
        title: '발급 이력',
        element: CertificateIssueHistoryPage,
        showInNav: true,
      },
      {
        path: 'verify',
        title: '진위확인',
        element: CertificateVerifyPage,
        showInNav: true,
      },
    ],
  },
  {
    path: 'recruitment',
    title: '채용관리',
    icon: Briefcase,
    element: JobPostingListPage,
    permissions: ['recruitment:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER'],
    showInNav: true,
    children: [
      {
        path: 'jobs/new',
        title: '공고 등록',
        element: JobPostingCreatePage,
        permissions: ['recruitment:write'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
        showInNav: true,
      },
      {
        path: 'jobs/:id',
        title: '공고 상세',
        element: JobPostingDetailPage,
        permissions: ['recruitment:read'],
        showInNav: false,
      },
      {
        path: 'jobs/:id/edit',
        title: '공고 수정',
        element: JobPostingCreatePage,
        permissions: ['recruitment:write'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
        showInNav: false,
      },
      {
        path: 'applications',
        title: '지원서 관리',
        element: ApplicationListPage,
        permissions: ['recruitment:read'],
        showInNav: true,
      },
      {
        path: 'applications/:id',
        title: '지원서 상세',
        element: ApplicationDetailPage,
        permissions: ['recruitment:read'],
        showInNav: false,
      },
      {
        path: 'interviews',
        title: '면접 일정',
        element: InterviewListPage,
        permissions: ['recruitment:read'],
        showInNav: true,
      },
      {
        path: 'my-interviews',
        title: '내 면접',
        element: MyInterviewsPage,
        // 면접관은 권한 없이 접근 가능 (본인 면접만 조회)
        showInNav: true,
      },
    ],
  },
  {
    path: 'transfer',
    title: '계열사 인사이동',
    icon: ArrowLeftRight,
    element: TransferListPage,
    permissions: ['transfer:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER'],
    showInNav: true,
    children: [
      {
        path: 'new',
        title: '인사이동 요청',
        element: TransferRequestPage,
        permissions: ['transfer:write'],
        showInNav: true,
      },
      {
        path: ':id',
        title: '인사이동 상세',
        element: TransferDetailPage,
        permissions: ['transfer:read'],
        showInNav: false,
      },
    ],
  },
  {
    path: 'headcount',
    title: '정현원 관리',
    icon: UsersRound,
    element: HeadcountPage,
    permissions: ['headcount:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER'],
    showInNav: true,
    children: [
      {
        path: 'requests',
        title: '변경 요청',
        element: HeadcountRequestsPage,
        permissions: ['headcount:read'],
        showInNav: true,
      },
    ],
  },
  {
    path: 'condolence',
    title: '경조비 관리',
    icon: Heart,
    element: CondolenceListPage,
    permissions: ['condolence:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'],
    showInNav: true,
  },
  {
    path: 'committee',
    title: '위원회 관리',
    icon: Users2,
    element: CommitteeListPage,
    permissions: ['committee:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER'],
    showInNav: true,
  },
  {
    path: 'employee-card',
    title: '사원증 관리',
    icon: CreditCard,
    element: EmployeeCardListPage,
    permissions: ['employee-card:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'],
    showInNav: true,
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
    children: [
      {
        path: 'approval-templates',
        title: '결재 양식 관리',
        element: ApprovalTemplatesPage,
        permissions: ['approval:admin'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
        showInNav: true,
      },
      {
        path: 'approval-templates/new',
        title: '양식 등록',
        element: ApprovalTemplateEditPage,
        permissions: ['approval:admin'],
        showInNav: false,
      },
      {
        path: 'approval-templates/:id',
        title: '양식 수정',
        element: ApprovalTemplateEditPage,
        permissions: ['approval:admin'],
        showInNav: false,
      },
      {
        path: 'privacy-access',
        title: '개인정보 열람 이력',
        element: PrivacyAccessLogPage,
        permissions: ['employee:read:sensitive'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
        showInNav: true,
      },
      {
        path: 'delegation-rules',
        title: '위임전결 규칙',
        element: DelegationRulesPage,
        permissions: ['approval:admin'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
        showInNav: true,
      },
    ],
  },
  {
    path: 'tenants/compare',
    title: '테넌트 비교',
    icon: GitCompare,
    element: TenantComparisonPage,
    permissions: ['tenant:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN'],
    showInNav: false,
  },
  {
    path: 'mdm',
    title: '기준정보 관리',
    icon: Database,
    element: CodeGroupPage,
    permissions: ['mdm:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN'],
    showInNav: true,
    children: [
      {
        path: 'code-groups',
        title: '코드그룹 관리',
        element: CodeGroupPage,
        permissions: ['mdm:read'],
        showInNav: true,
      },
      {
        path: 'common-codes',
        title: '공통코드 관리',
        element: CommonCodePage,
        permissions: ['mdm:read'],
        showInNav: true,
      },
      {
        path: 'tenant-codes',
        title: '테넌트 코드 관리',
        element: TenantCodePage,
        permissions: ['mdm:write'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN'],
        showInNav: true,
      },
    ],
  },
  {
    path: 'audit',
    title: '감사 로그',
    icon: Shield,
    element: AuditLogPage,
    permissions: ['audit:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN'],
    showInNav: true,
  },
  {
    path: 'admin/tenants',
    title: '테넌트 관리',
    icon: Building,
    element: TenantListPage,
    permissions: ['tenant:admin'],
    roles: ['SUPER_ADMIN'],
    showInNav: true,
    children: [
      {
        path: ':id',
        title: '테넌트 상세',
        element: TenantDetailPage,
        permissions: ['tenant:admin'],
        showInNav: false, // 동적 라우트는 숨김
      },
    ],
  },
  {
    path: 'help',
    title: '도움말',
    icon: HelpCircle,
    element: HelpGuidePage,
    showInNav: true,
    children: [
      {
        path: 'guide',
        title: '사용자 가이드',
        element: HelpGuidePage,
        showInNav: true,
      },
      {
        path: 'faq',
        title: '자주 묻는 질문',
        element: HelpFAQPage,
        showInNav: true,
      },
      {
        path: 'contact',
        title: '문의하기',
        element: HelpContactPage,
        showInNav: true,
      },
    ],
  },
  {
    path: 'announcements',
    title: '공지사항',
    icon: Megaphone,
    element: AnnouncementListPage,
    showInNav: true,
    children: [
      {
        path: ':id',
        title: '공지사항 상세',
        element: AnnouncementDetailPage,
        showInNav: false, // 동적 라우트는 숨김
      },
    ],
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
    .map((route) => {
      // Filter children that should be shown in nav
      const navChildren = route.children
        ?.filter((child) => child.showInNav === true)
        .map((child) => ({
          title: child.title,
          href: `/${route.path}/${child.path}`,
          permissions: child.permissions,
          roles: child.roles,
        }));

      return {
        title: route.title,
        href: `/${route.path}`,
        icon: route.icon,
        permissions: route.permissions,
        roles: route.roles,
        children: navChildren && navChildren.length > 0 ? navChildren : undefined,
      };
    });
}
