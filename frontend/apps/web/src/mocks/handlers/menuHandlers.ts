import { http, HttpResponse, delay } from 'msw';
import type { MenuItemResponse, TenantMenuConfigResponse, UserMenuResponse, UserMenuItem } from '../../features/menu/types';

// Mock menu items - routes/config.ts와 동일한 구조 및 경로 사용
const mockMenus: MenuItemResponse[] = [
  // ============================================
  // 그룹 1: 메인
  // ============================================
  {
    id: 'menu-1',
    code: 'DASHBOARD',
    name: '대시보드',
    nameEn: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 1,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: true,
    mobileSortOrder: 1,
    permissions: [],
    children: [],
    groupName: '메인',
  },
  {
    id: 'menu-2',
    code: 'MY_INFO',
    name: '내 정보',
    nameEn: 'My Info',
    path: '/my-info',
    icon: 'User',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 2,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: true,
    mobileSortOrder: 5,
    permissions: [],
    children: [],
    groupName: '메인',
  },
  {
    id: 'menu-3',
    code: 'ANNOUNCEMENTS',
    name: '공지사항',
    nameEn: 'Announcements',
    path: '/announcements',
    icon: 'Megaphone',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 3,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: [],
    children: [],
    groupName: '메인',
  },
  {
    id: 'menu-4',
    code: 'NOTIFICATIONS',
    name: '알림',
    nameEn: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 4,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: true,
    mobileSortOrder: 4,
    permissions: [],
    children: [],
    groupName: '메인',
  },
  {
    id: 'menu-05',
    code: 'ORG_CHART',
    name: '조직도',
    nameEn: 'Organization Chart',
    path: '/org-chart',
    icon: 'Building2',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 5,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: [],
    children: [],
    groupName: '메인',
  },

  // ============================================
  // 그룹 2: 인사관리
  // ============================================
  {
    id: 'menu-10',
    code: 'EMPLOYEES',
    name: '인사정보',
    nameEn: 'Employee Management',
    path: '/employees',
    icon: 'Users',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 10,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: ['employee:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'],
    children: [],
    groupName: '인사관리',
  },
  {
    id: 'menu-11',
    code: 'ORGANIZATION',
    name: '조직관리',
    nameEn: 'Organization',
    path: '/organization',
    icon: 'Building2',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 11,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['organization:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [
      {
        id: 'menu-11-1',
        parentId: 'menu-11',
        code: 'DEPARTMENTS',
        name: '부서 목록',
        nameEn: 'Departments',
        path: '/organization/departments',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-11-2',
        parentId: 'menu-11',
        code: 'GRADES',
        name: '직급 관리',
        nameEn: 'Grades',
        path: '/organization/grades',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['organization:write'],
        children: [],
      },
      {
        id: 'menu-11-3',
        parentId: 'menu-11',
        code: 'POSITIONS',
        name: '직책 관리',
        nameEn: 'Positions',
        path: '/organization/positions',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['organization:write'],
        children: [],
      },
      {
        id: 'menu-11-4',
        parentId: 'menu-11',
        code: 'ORG_HISTORY',
        name: '변경 이력',
        nameEn: 'History',
        path: '/organization/history',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 4,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
    ],
    groupName: '인사관리',
  },
  {
    id: 'menu-12',
    code: 'APPOINTMENTS',
    name: '발령관리',
    nameEn: 'Appointments',
    path: '/appointments',
    icon: 'UserCog',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 12,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['appointment:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [],
    groupName: '인사관리',
  },
  {
    id: 'menu-13',
    code: 'TRANSFER',
    name: '계열사 인사이동',
    nameEn: 'Transfer',
    path: '/transfer',
    icon: 'ArrowLeftRight',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 13,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['transfer:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [],
    groupName: '인사관리',
  },
  {
    id: 'menu-14',
    code: 'HEADCOUNT',
    name: '정현원 관리',
    nameEn: 'Headcount',
    path: '/headcount',
    icon: 'UsersRound',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 14,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['headcount:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [
      {
        id: 'menu-14-1',
        parentId: 'menu-14',
        code: 'HEADCOUNT_REQUESTS',
        name: '변경 요청',
        nameEn: 'Requests',
        path: '/headcount/requests',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['headcount:read'],
        children: [],
      },
    ],
    groupName: '인사관리',
  },
  {
    id: 'menu-15',
    code: 'RECRUITMENT',
    name: '채용관리',
    nameEn: 'Recruitment',
    path: '/recruitment',
    icon: 'Briefcase',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 15,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['recruitment:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [],
    groupName: '인사관리',
  },

  // ============================================
  // 그룹 3: 근무관리
  // ============================================
  {
    id: 'menu-20',
    code: 'ATTENDANCE',
    name: '근태/휴가',
    nameEn: 'Attendance',
    path: '/attendance',
    icon: 'Calendar',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 20,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: true,
    mobileSortOrder: 2,
    permissions: [],
    children: [
      {
        id: 'menu-20-1',
        parentId: 'menu-20',
        code: 'LEAVE_REQUEST',
        name: '휴가 신청',
        nameEn: 'Leave Request',
        path: '/attendance/leave',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-20-2',
        parentId: 'menu-20',
        code: 'MY_LEAVE',
        name: '내 휴가',
        nameEn: 'My Leave',
        path: '/attendance/my-leave',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-20-3',
        parentId: 'menu-20',
        code: 'LEAVE_CALENDAR',
        name: '휴가 캘린더',
        nameEn: 'Leave Calendar',
        path: '/attendance/leave/calendar',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-20-4',
        parentId: 'menu-20',
        code: 'LEAVE_APPROVAL',
        name: '휴가 승인',
        nameEn: 'Leave Approval',
        path: '/attendance/leave/approval',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 4,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['attendance:approve'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER'],
        children: [],
      },
      {
        id: 'menu-20-5',
        parentId: 'menu-20',
        code: 'OVERTIME',
        name: '초과근무',
        nameEn: 'Overtime',
        path: '/attendance/overtime',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 5,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-20-6',
        parentId: 'menu-20',
        code: 'WORK_HOURS',
        name: '52시간 모니터링',
        nameEn: 'Work Hours Monitoring',
        path: '/attendance/work-hours',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 6,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['attendance:read'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER'],
        children: [],
      },
    ],
    groupName: '근무관리',
  },

  // ============================================
  // 그룹 4: 전자결재
  // ============================================
  {
    id: 'menu-30',
    code: 'APPROVALS',
    name: '전자결재',
    nameEn: 'Approvals',
    path: '/approvals',
    icon: 'FileCheck',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 30,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: true,
    mobileSortOrder: 3,
    permissions: [],
    children: [
      {
        id: 'menu-30-1',
        parentId: 'menu-30',
        code: 'APPROVAL_CREATE',
        name: '결재 작성',
        nameEn: 'Create Approval',
        path: '/approvals/new',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-30-2',
        parentId: 'menu-30',
        code: 'MY_APPROVALS',
        name: '내 결재',
        nameEn: 'My Approvals',
        path: '/approvals/my',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-30-3',
        parentId: 'menu-30',
        code: 'DELEGATION',
        name: '결재 위임',
        nameEn: 'Delegation',
        path: '/approvals/delegation',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
    ],
    groupName: '전자결재',
  },

  // ============================================
  // 그룹 5: 복리후생
  // ============================================
  {
    id: 'menu-40',
    code: 'CERTIFICATES',
    name: '증명서',
    nameEn: 'Certificates',
    path: '/certificates',
    icon: 'FileText',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 40,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: [],
    children: [],
    groupName: '복리후생',
  },
  {
    id: 'menu-41',
    code: 'CONDOLENCE',
    name: '경조비 관리',
    nameEn: 'Condolence',
    path: '/condolence',
    icon: 'Heart',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 41,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: ['condolence:read'],
    children: [],
    groupName: '복리후생',
  },
  {
    id: 'menu-42',
    code: 'EMPLOYEE_CARD',
    name: '사원증 관리',
    nameEn: 'Employee Card',
    path: '/employee-card',
    icon: 'CreditCard',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 42,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['employee-card:read'],
    children: [],
    groupName: '복리후생',
  },
  {
    id: 'menu-43',
    code: 'COMMITTEE',
    name: '위원회 관리',
    nameEn: 'Committee',
    path: '/committee',
    icon: 'Users2',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 43,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['committee:read'],
    children: [],
    groupName: '복리후생',
  },

  // ============================================
  // 그룹 6: 시스템 관리
  // ============================================
  {
    id: 'menu-50',
    code: 'SETTINGS',
    name: '설정',
    nameEn: 'Settings',
    path: '/settings',
    icon: 'Settings',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 50,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: [],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [],
    groupName: '시스템 관리',
  },
  {
    id: 'menu-51',
    code: 'MDM',
    name: '기준정보 관리',
    nameEn: 'Master Data',
    path: '/mdm',
    icon: 'Database',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 51,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['mdm:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [
      {
        id: 'menu-51-1',
        parentId: 'menu-51',
        code: 'MDM_CODE_GROUPS',
        name: '코드그룹 관리',
        nameEn: 'Code Groups',
        path: '/mdm/code-groups',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['mdm:read'],
        children: [],
      },
      {
        id: 'menu-51-2',
        parentId: 'menu-51',
        code: 'MDM_COMMON_CODES',
        name: '공통코드 관리',
        nameEn: 'Common Codes',
        path: '/mdm/common-codes',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['mdm:read'],
        children: [],
      },
      {
        id: 'menu-51-3',
        parentId: 'menu-51',
        code: 'MDM_TENANT_CODES',
        name: '테넌트 코드 관리',
        nameEn: 'Tenant Codes',
        path: '/mdm/tenant-codes',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: ['mdm:write'],
        roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN'],
        children: [],
      },
    ],
    groupName: '시스템 관리',
  },
  {
    id: 'menu-52',
    code: 'FILES',
    name: '파일 관리',
    nameEn: 'File Management',
    path: '/files',
    icon: 'FolderOpen',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 52,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['file:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'],
    children: [],
    groupName: '시스템 관리',
  },

  // ============================================
  // 그룹 7: 운영관리
  // ============================================
  {
    id: 'menu-60',
    code: 'ADMIN_MENUS',
    name: '메뉴 관리',
    nameEn: 'Menu Management',
    path: '/admin/menus',
    icon: 'Menu',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 60,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['tenant:admin'],
    roles: ['SUPER_ADMIN'],
    children: [],
    groupName: '운영관리',
  },
  {
    id: 'menu-61',
    code: 'ADMIN_TENANTS',
    name: '테넌트 관리',
    nameEn: 'Tenant Management',
    path: '/admin/tenants',
    icon: 'Building',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 61,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['tenant:admin'],
    roles: ['SUPER_ADMIN'],
    children: [],
    groupName: '운영관리',
  },
  {
    id: 'menu-62',
    code: 'AUDIT',
    name: '감사 로그',
    nameEn: 'Audit Log',
    path: '/audit',
    icon: 'Shield',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 62,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    mobileSortOrder: undefined,
    permissions: ['audit:read'],
    roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN'],
    children: [],
    groupName: '운영관리',
  },

  // ============================================
  // 그룹 8: 지원
  // ============================================
  {
    id: 'menu-70',
    code: 'HELP',
    name: '도움말',
    nameEn: 'Help',
    path: '/help',
    icon: 'HelpCircle',
    menuType: 'INTERNAL',
    level: 1,
    sortOrder: 70,
    isSystem: true,
    isActive: true,
    showInNav: true,
    showInMobile: false,
    permissions: [],
    children: [
      {
        id: 'menu-70-1',
        parentId: 'menu-70',
        code: 'HELP_GUIDE',
        name: '사용자 가이드',
        nameEn: 'User Guide',
        path: '/help/guide',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 1,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-70-2',
        parentId: 'menu-70',
        code: 'HELP_FAQ',
        name: '자주 묻는 질문',
        nameEn: 'FAQ',
        path: '/help/faq',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 2,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
      {
        id: 'menu-70-3',
        parentId: 'menu-70',
        code: 'HELP_CONTACT',
        name: '문의하기',
        nameEn: 'Contact',
        path: '/help/contact',
        menuType: 'INTERNAL',
        level: 2,
        sortOrder: 3,
        isSystem: true,
        isActive: true,
        showInNav: true,
        showInMobile: false,
        permissions: [],
        children: [],
      },
    ],
    groupName: '지원',
  },
];

// Tenant menu configs
const tenantConfigs: Map<string, TenantMenuConfigResponse[]> = new Map();

// Flatten menus for flat API
function flattenMenus(menus: MenuItemResponse[]): MenuItemResponse[] {
  const result: MenuItemResponse[] = [];
  for (const menu of menus) {
    result.push(menu);
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children));
    }
  }
  return result;
}

// Convert MenuItemResponse to UserMenuItem
function toUserMenuItem(menu: MenuItemResponse): UserMenuItem {
  return {
    code: menu.code,
    name: menu.name,
    nameEn: menu.nameEn,
    path: menu.path,
    icon: menu.icon,
    externalUrl: menu.externalUrl,
    isExternal: menu.menuType === 'EXTERNAL',
    sortOrder: menu.sortOrder,
    roles: menu.roles,
    permissions: menu.permissions,
    children: menu.children?.map(toUserMenuItem),
    groupName: menu.groupName,
  };
}

export const menuHandlers = [
  // Get user menus
  http.get('/api/v1/menus/me', async () => {
    await delay(200);

    const sidebarMenus = mockMenus
      .filter((m) => m.showInNav && m.isActive)
      .map(toUserMenuItem);
    const mobileMenus = mockMenus
      .filter((m) => m.showInMobile && m.isActive)
      .sort((a, b) => (a.mobileSortOrder ?? 99) - (b.mobileSortOrder ?? 99))
      .slice(0, 5)
      .map(toUserMenuItem);

    const response: UserMenuResponse = {
      sidebarMenus,
      mobileMenus,
    };

    return HttpResponse.json({
      success: true,
      data: response,
    });
  }),

  // Get all menus tree (admin)
  http.get('/api/v1/admin/menus', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: mockMenus,
    });
  }),

  // Get all menus flat (admin)
  http.get('/api/v1/admin/menus/flat', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: flattenMenus(mockMenus),
    });
  }),

  // Get menu by ID
  http.get('/api/v1/admin/menus/:id', async ({ params }) => {
    await delay(200);

    const allMenus = flattenMenus(mockMenus);
    const menu = allMenus.find((m) => m.id === params.id);

    if (!menu) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '메뉴를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: menu,
    });
  }),

  // Get menu by code
  http.get('/api/v1/admin/menus/code/:code', async ({ params }) => {
    await delay(200);

    const allMenus = flattenMenus(mockMenus);
    const menu = allMenus.find((m) => m.code === params.code);

    if (!menu) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '메뉴를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: menu,
    });
  }),

  // Create menu
  http.post('/api/v1/admin/menus', async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as any;
    const newMenu: MenuItemResponse = {
      id: `menu-${Date.now()}`,
      code: body.code,
      name: body.name,
      nameEn: body.nameEn,
      path: body.path,
      icon: body.icon,
      menuType: body.menuType || 'INTERNAL',
      externalUrl: body.externalUrl,
      level: body.parentId ? 2 : 1,
      sortOrder: body.sortOrder || 99,
      featureCode: body.featureCode,
      isSystem: false,
      isActive: body.isActive ?? true,
      showInNav: body.showInNav ?? true,
      showInMobile: body.showInMobile ?? false,
      mobileSortOrder: body.mobileSortOrder,
      parentId: body.parentId,
      permissions: [],
      children: [],
    };

    // Add to parent's children or root
    if (body.parentId) {
      const parent = mockMenus.find((m) => m.id === body.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(newMenu);
      }
    } else {
      mockMenus.push(newMenu);
    }

    return HttpResponse.json({
      success: true,
      data: newMenu,
    });
  }),

  // Update menu
  http.put('/api/v1/admin/menus/:id', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as any;
    const allMenus = flattenMenus(mockMenus);
    const menu = allMenus.find((m) => m.id === params.id);

    if (!menu) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '메뉴를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    Object.assign(menu, {
      name: body.name ?? menu.name,
      nameEn: body.nameEn ?? menu.nameEn,
      path: body.path ?? menu.path,
      icon: body.icon ?? menu.icon,
      isActive: body.isActive ?? menu.isActive,
      showInNav: body.showInNav ?? menu.showInNav,
      showInMobile: body.showInMobile ?? menu.showInMobile,
      sortOrder: body.sortOrder ?? menu.sortOrder,
      mobileSortOrder: body.mobileSortOrder ?? menu.mobileSortOrder,
    });

    return HttpResponse.json({
      success: true,
      data: menu,
    });
  }),

  // Delete menu
  http.delete('/api/v1/admin/menus/:id', async ({ params }) => {
    await delay(300);

    const index = mockMenus.findIndex((m) => m.id === params.id);
    if (index !== -1) {
      mockMenus.splice(index, 1);
    } else {
      // Check in children
      for (const menu of mockMenus) {
        if (menu.children) {
          const childIndex = menu.children.findIndex((c) => c.id === params.id);
          if (childIndex !== -1) {
            menu.children.splice(childIndex, 1);
            break;
          }
        }
      }
    }

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Reorder menus
  http.patch('/api/v1/admin/menus/reorder', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Get tenant menu configs
  http.get('/api/v1/tenants/:tenantId/menus/config', async ({ params }) => {
    await delay(300);

    const configs = tenantConfigs.get(params.tenantId as string) || [];

    return HttpResponse.json({
      success: true,
      data: configs,
    });
  }),

  // Get specific tenant menu config
  http.get('/api/v1/tenants/:tenantId/menus/:menuId/config', async ({ params }) => {
    await delay(200);

    const configs = tenantConfigs.get(params.tenantId as string) || [];
    const config = configs.find((c) => c.menuItemId === params.menuId);

    return HttpResponse.json({
      success: true,
      data: config || null,
    });
  }),

  // Update tenant menu config
  http.put('/api/v1/tenants/:tenantId/menus/:menuId/config', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as any;
    const tenantId = params.tenantId as string;
    const menuId = params.menuId as string;

    let configs = tenantConfigs.get(tenantId) || [];
    let config = configs.find((c) => c.menuItemId === menuId);

    if (config) {
      Object.assign(config, {
        isEnabled: body.isEnabled ?? config.isEnabled,
        customName: body.customName ?? config.customName,
        customSortOrder: body.customSortOrder ?? config.customSortOrder,
        showInMobile: body.showInMobile ?? config.showInMobile,
        mobileSortOrder: body.mobileSortOrder ?? config.mobileSortOrder,
      });
    } else {
      // Find the menu to get code and name
      const allMenus = flattenMenus(mockMenus);
      const menu = allMenus.find(m => m.id === menuId);
      config = {
        id: `config-${Date.now()}`,
        tenantId,
        menuItemId: menuId,
        menuCode: menu?.code || '',
        menuName: menu?.name || '',
        isEnabled: body.isEnabled ?? true,
        customName: body.customName,
        customSortOrder: body.customSortOrder,
        showInMobile: body.showInMobile,
        mobileSortOrder: body.mobileSortOrder,
      };
      configs.push(config);
      tenantConfigs.set(tenantId, configs);
    }

    return HttpResponse.json({
      success: true,
      data: config,
    });
  }),

  // Reset tenant menu config
  http.delete('/api/v1/tenants/:tenantId/menus/:menuId/config', async ({ params }) => {
    await delay(200);

    const tenantId = params.tenantId as string;
    const menuId = params.menuId as string;
    const configs = tenantConfigs.get(tenantId) || [];
    const index = configs.findIndex((c) => c.menuItemId === menuId);

    if (index !== -1) {
      configs.splice(index, 1);
    }

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Reset all tenant menu configs
  http.delete('/api/v1/tenants/:tenantId/menus/config', async ({ params }) => {
    await delay(300);

    tenantConfigs.delete(params.tenantId as string);

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),
];
