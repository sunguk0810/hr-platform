import { http, HttpResponse, delay } from 'msw';

/**
 * 역할 (Roles) 정의 - quickLoginAccounts와 일치:
 * - SUPER_ADMIN: 시스템 최고 관리자 (모든 테넌트 관리)
 * - GROUP_ADMIN: 그룹 HR 총괄 (계열사 전체 접근)
 * - TENANT_ADMIN: 테넌트 관리자
 * - HR_ADMIN: HR 관리자
 * - HR_MANAGER: HR 담당자
 * - DEPT_MANAGER: 부서장
 * - TEAM_LEADER: 팀장
 * - EMPLOYEE: 일반 직원
 */

// 멀티 테넌트 (계열사) 목록
const mockTenants = [
  {
    id: 'tenant-001',
    code: 'HOLDINGS',
    name: 'HR그룹 지주회사',
    nameEn: 'HR Group Holdings',
    logoUrl: undefined,
    status: 'ACTIVE' as const,
  },
  {
    id: 'tenant-002',
    code: 'TECH',
    name: 'HR테크',
    nameEn: 'HR Tech',
    logoUrl: undefined,
    status: 'ACTIVE' as const,
  },
  {
    id: 'tenant-003',
    code: 'CONSULTING',
    name: 'HR컨설팅',
    nameEn: 'HR Consulting',
    logoUrl: undefined,
    status: 'ACTIVE' as const,
  },
  {
    id: 'tenant-004',
    code: 'ACADEMY',
    name: 'HR아카데미',
    nameEn: 'HR Academy',
    logoUrl: undefined,
    status: 'ACTIVE' as const,
  },
  {
    id: 'tenant-005',
    code: 'PARTNERS',
    name: 'HR파트너스',
    nameEn: 'HR Partners',
    logoUrl: undefined,
    status: 'ACTIVE' as const,
  },
];

// P2 기능 권한 (관리자용)
const p2AdminPermissions = [
  'transfer:read',
  'transfer:write',
  'headcount:read',
  'headcount:write',
  'condolence:read',
  'condolence:write',
  'committee:read',
  'committee:write',
  'employee-card:read',
  'employee-card:write',
];

// P2 기능 권한 (직원용)
const p2EmployeePermissions = [
  'condolence:read',
  'condolence:write',
  'employee-card:read',
];

// ============================================================
// 사용자 계정 목록 (quickLoginAccounts와 일치)
// ============================================================

// 1. 시스템 관리자 (admin / admin1234) - 모든 권한
const superAdminUser = {
  id: 'user-admin-001',
  employeeId: 'emp-admin-001',
  employeeNumber: 'SYS2024001',
  name: '관리자',
  email: 'admin@hrgroup.com',
  departmentId: 'dept-system',
  departmentName: '시스템운영팀',
  positionName: '팀장',
  gradeName: '부장',
  profileImageUrl: undefined,
  roles: ['SUPER_ADMIN'],
  permissions: [
    'employee:read',
    'employee:write',
    'employee:delete',
    'employee:read:sensitive',
    'organization:read',
    'organization:write',
    'organization:delete',
    'attendance:read',
    'attendance:write',
    'attendance:approve',
    'attendance:admin',
    'approval:read',
    'approval:write',
    'approval:approve',
    'approval:admin',
    'appointment:read',
    'appointment:write',
    'appointment:approve',
    'recruitment:read',
    'recruitment:write',
    'tenant:read',
    'tenant:write',
    'tenant:admin',
    'mdm:read',
    'mdm:write',
    'mdm:delete',
    'audit:read',
    'settings:read',
    'settings:write',
    ...p2AdminPermissions,
  ],
};

// 2. 그룹 HR 총괄 (group / group1234) - 계열사 전체 관리
const groupAdminUser = {
  id: 'user-group-001',
  employeeId: 'emp-group-001',
  employeeNumber: 'GRP2024001',
  name: '김그룹',
  email: 'group@hrgroup.com',
  departmentId: 'dept-group',
  departmentName: '그룹 인사전략실',
  positionName: '실장',
  gradeName: '임원',
  profileImageUrl: undefined,
  roles: ['GROUP_ADMIN'],
  permissions: [
    'employee:read',
    'employee:write',
    'employee:read:sensitive',
    'organization:read',
    'organization:write',
    'attendance:read',
    'attendance:write',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    'approval:admin',
    'appointment:read',
    'appointment:write',
    'appointment:approve',
    'recruitment:read',
    'recruitment:write',
    'tenant:read',
    'mdm:read',
    'mdm:write',
    'audit:read',
    'settings:read',
    'settings:write',
    ...p2AdminPermissions,
  ],
};

// 3. 테넌트 관리자 (tenant / tenant1234) - 단일 계열사 관리
const tenantAdminUser = {
  id: 'user-tenant-001',
  employeeId: 'emp-tenant-001',
  employeeNumber: 'TNT2024001',
  name: '박테넌트',
  email: 'tenant@hrtech.com',
  departmentId: 'dept-admin',
  departmentName: '경영지원팀',
  positionName: '팀장',
  gradeName: '부장',
  profileImageUrl: undefined,
  roles: ['TENANT_ADMIN'],
  permissions: [
    'employee:read',
    'employee:write',
    'employee:read:sensitive',
    'organization:read',
    'organization:write',
    'attendance:read',
    'attendance:write',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    'approval:admin',
    'appointment:read',
    'appointment:write',
    'recruitment:read',
    'recruitment:write',
    'mdm:read',
    'mdm:write',
    'audit:read',
    'settings:read',
    'settings:write',
    ...p2AdminPermissions,
  ],
};

// 4. HR 관리자 (hradmin / hradmin1234) - HR 전체 관리
const hrAdminUser = {
  id: 'user-hradmin-001',
  employeeId: 'emp-hradmin-001',
  employeeNumber: 'HRA2024001',
  name: '최인사',
  email: 'hradmin@hrtech.com',
  departmentId: 'dept-hr',
  departmentName: '인사팀',
  positionName: '팀장',
  gradeName: '부장',
  profileImageUrl: undefined,
  roles: ['HR_ADMIN'],
  permissions: [
    'employee:read',
    'employee:write',
    'employee:read:sensitive',
    'organization:read',
    'organization:write',
    'attendance:read',
    'attendance:write',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    'approval:admin',
    'appointment:read',
    'appointment:write',
    'recruitment:read',
    'recruitment:write',
    'mdm:read',
    'mdm:write',
    'audit:read',
    'settings:read',
    ...p2AdminPermissions,
  ],
};

// 5. HR 담당자 (hr / hr1234) - 인사/근태 담당
const hrManagerUser = {
  id: 'user-hr-001',
  employeeId: 'emp-hr-001',
  employeeNumber: 'HRM2024001',
  name: '정담당',
  email: 'hr@hrtech.com',
  departmentId: 'dept-hr',
  departmentName: '인사팀',
  positionName: '과장',
  gradeName: '과장',
  profileImageUrl: undefined,
  roles: ['HR_MANAGER'],
  permissions: [
    'employee:read',
    'employee:write',
    'organization:read',
    'attendance:read',
    'attendance:write',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    'appointment:read',
    'appointment:write',
    'recruitment:read',
    'mdm:read',
    ...p2AdminPermissions,
  ],
};

// 6. 부서장 (deptmgr / deptmgr1234) - 부서 결재 권한
const deptManagerUser = {
  id: 'user-deptmgr-001',
  employeeId: 'emp-deptmgr-001',
  employeeNumber: 'DPT2024001',
  name: '강부서장',
  email: 'deptmgr@hrtech.com',
  departmentId: 'dept-dev',
  departmentName: '개발본부',
  positionName: '본부장',
  gradeName: '이사',
  profileImageUrl: undefined,
  roles: ['DEPT_MANAGER'],
  permissions: [
    'employee:read',
    'organization:read',
    'attendance:read',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    ...p2EmployeePermissions,
  ],
};

// 7. 팀장 (teamlead / teamlead1234) - 팀 결재 권한
const teamLeaderUser = {
  id: 'user-teamlead-001',
  employeeId: 'emp-teamlead-001',
  employeeNumber: 'TLD2024001',
  name: '윤팀장',
  email: 'teamlead@hrtech.com',
  departmentId: 'dept-dev-fe',
  departmentName: '프론트엔드팀',
  positionName: '팀장',
  gradeName: '차장',
  profileImageUrl: undefined,
  roles: ['TEAM_LEADER'],
  permissions: [
    'employee:read',
    'organization:read',
    'attendance:read',
    'attendance:approve',
    'approval:read',
    'approval:write',
    'approval:approve',
    ...p2EmployeePermissions,
  ],
};

// 8. 일반 직원 (employee / employee1234) - 기본 직원 권한
const employeeUser = {
  id: 'user-employee-001',
  employeeId: 'emp-employee-001',
  employeeNumber: 'EMP2024001',
  name: '이직원',
  email: 'employee@hrtech.com',
  departmentId: 'dept-dev-fe',
  departmentName: '프론트엔드팀',
  positionName: '사원',
  gradeName: '사원',
  profileImageUrl: undefined,
  roles: ['EMPLOYEE'],
  permissions: [
    'employee:read',
    'attendance:read',
    'attendance:write',
    'approval:read',
    'approval:write',
    ...p2EmployeePermissions,
  ],
};

// 로그인 응답 생성 헬퍼
const createLoginResponse = (
  user: typeof superAdminUser,
  tenant: typeof mockTenants[0],
  availableTenants: typeof mockTenants
) => ({
  success: true,
  data: {
    user,
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    tenant,
    availableTenants,
  },
  timestamp: new Date().toISOString(),
});

export const authHandlers = [
  // Login
  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(500);

    const body = await request.json() as { username?: string; password?: string };
    const { username, password } = body;

    // 1. 시스템 관리자 (admin / admin1234) - 모든 권한
    if (username === 'admin' && password === 'admin1234') {
      return HttpResponse.json(
        createLoginResponse(superAdminUser, mockTenants[0], mockTenants)
      );
    }

    // 2. 그룹 HR 총괄 (group / group1234) - 계열사 전체 관리
    if (username === 'group' && password === 'group1234') {
      return HttpResponse.json(
        createLoginResponse(groupAdminUser, mockTenants[0], mockTenants)
      );
    }

    // 3. 테넌트 관리자 (tenant / tenant1234) - 단일 계열사 관리
    if (username === 'tenant' && password === 'tenant1234') {
      return HttpResponse.json(
        createLoginResponse(tenantAdminUser, mockTenants[1], [mockTenants[1]])
      );
    }

    // 4. HR 관리자 (hradmin / hradmin1234) - HR 전체 관리
    if (username === 'hradmin' && password === 'hradmin1234') {
      return HttpResponse.json(
        createLoginResponse(hrAdminUser, mockTenants[1], [mockTenants[1]])
      );
    }

    // 5. HR 담당자 (hr / hr1234) - 인사/근태 담당
    if (username === 'hr' && password === 'hr1234') {
      return HttpResponse.json(
        createLoginResponse(hrManagerUser, mockTenants[1], [mockTenants[1]])
      );
    }

    // 6. 부서장 (deptmgr / deptmgr1234) - 부서 결재 권한
    if (username === 'deptmgr' && password === 'deptmgr1234') {
      return HttpResponse.json(
        createLoginResponse(deptManagerUser, mockTenants[1], [mockTenants[1]])
      );
    }

    // 7. 팀장 (teamlead / teamlead1234) - 팀 결재 권한
    if (username === 'teamlead' && password === 'teamlead1234') {
      return HttpResponse.json(
        createLoginResponse(teamLeaderUser, mockTenants[1], [mockTenants[1]])
      );
    }

    // 8. 일반 직원 (employee / employee1234) - 기본 직원 권한
    if (username === 'employee' && password === 'employee1234') {
      return HttpResponse.json(
        createLoginResponse(employeeUser, mockTenants[1], [mockTenants[1]])
      );
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_001',
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  // Logout
  http.post('/api/v1/auth/logout', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: null,
      message: '로그아웃되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Refresh token
  http.post('/api/v1/auth/token/refresh', async ({ request }) => {
    await delay(200);

    const body = await request.json() as { refreshToken?: string };
    const { refreshToken } = body;

    if (refreshToken && refreshToken.startsWith('mock-refresh-token-')) {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_002',
          message: '세션이 만료되었습니다.',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  // Get current user
  http.get('/api/v1/auth/me', async ({ request }) => {
    await delay(300);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_003',
            message: '인증이 필요합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 실제 앱에서는 토큰에서 사용자 정보를 추출
    // 여기서는 기본적으로 시스템 관리자 반환
    return HttpResponse.json({
      success: true,
      data: superAdminUser,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get available tenants for current user
  http.get('/api/v1/auth/tenants', async ({ request }) => {
    await delay(200);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_003',
            message: '인증이 필요합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockTenants,
      timestamp: new Date().toISOString(),
    });
  }),

  // Switch tenant
  http.post('/api/v1/auth/switch-tenant', async ({ request }) => {
    await delay(300);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_003',
            message: '인증이 필요합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = await request.json() as { tenantId?: string };
    const { tenantId } = body;

    const tenant = mockTenants.find(t => t.id === tenantId);
    if (!tenant) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_004',
            message: '유효하지 않은 테넌트입니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        tenant,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      },
      message: `${tenant.name}(으)로 전환되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }),
];
