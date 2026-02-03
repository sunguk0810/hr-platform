import { http, HttpResponse, delay } from 'msw';
import type {
  TenantDetail,
  TenantListItem,
  TenantStatus,
  TenantPolicies,
  TenantSettings,
} from '@hr-platform/shared-types';

const defaultPolicies: TenantPolicies = {
  maxEmployees: 500,
  maxDepartments: 50,
  allowedModules: ['EMPLOYEE', 'ORGANIZATION', 'ATTENDANCE', 'LEAVE', 'APPROVAL', 'MDM', 'NOTIFICATION'],
  leavePolicy: {
    annualLeaveBaseDays: 15,
    annualLeaveIncrement: 1,
    maxAnnualLeave: 25,
    sickLeaveDays: 3,
    specialLeaveDays: 5,
    carryOverEnabled: true,
    carryOverMaxDays: 5,
    carryOverExpiryMonths: 3,
  },
  attendancePolicy: {
    workStartTime: '09:00',
    workEndTime: '18:00',
    lateGraceMinutes: 10,
    earlyLeaveGraceMinutes: 10,
    requiredWorkHours: 8,
    overtimeEnabled: true,
    flexibleTimeEnabled: false,
  },
  approvalPolicy: {
    maxApprovalSteps: 5,
    autoApprovalEnabled: false,
    autoApprovalDays: 3,
    parallelApprovalEnabled: false,
  },
};

const defaultSettings: TenantSettings = {
  locale: 'ko',
  timezone: 'Asia/Seoul',
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm',
  currency: 'KRW',
  fiscalYearStartMonth: 1,
};

const mockTenants: TenantDetail[] = [
  {
    id: 'tenant-001',
    code: 'ACME',
    name: '(주)아크미코리아',
    nameEn: 'ACME Korea Inc.',
    description: '종합 IT 솔루션 기업',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
    },
    policies: defaultPolicies,
    settings: defaultSettings,
    employeeCount: 156,
    departmentCount: 12,
    adminEmail: 'admin@acme.co.kr',
    adminName: '관리자',
    contractStartDate: '2023-01-01',
    contractEndDate: '2025-12-31',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'tenant-002',
    code: 'GLOBEX',
    name: '글로벡스',
    nameEn: 'Globex Corporation',
    description: '글로벌 무역 및 물류',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
    },
    policies: { ...defaultPolicies, maxEmployees: 300 },
    settings: defaultSettings,
    employeeCount: 89,
    departmentCount: 8,
    adminEmail: 'admin@globex.com',
    adminName: '김관리',
    contractStartDate: '2023-06-01',
    contractEndDate: '2025-05-31',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'tenant-003',
    code: 'INITECH',
    name: '이니텍',
    nameEn: 'Initech',
    description: '소프트웨어 개발 및 컨설팅',
    logoUrl: undefined,
    status: 'INACTIVE',
    branding: {
      primaryColor: '#7c3aed',
      secondaryColor: '#6d28d9',
    },
    policies: { ...defaultPolicies, maxEmployees: 100 },
    settings: defaultSettings,
    employeeCount: 45,
    departmentCount: 5,
    adminEmail: 'admin@initech.io',
    adminName: '박관리',
    contractStartDate: '2022-01-01',
    contractEndDate: '2023-12-31',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tenant-004',
    code: 'UMBRELLA',
    name: '엄브렐라 바이오',
    nameEn: 'Umbrella Bio',
    description: '바이오 헬스케어',
    logoUrl: undefined,
    status: 'SUSPENDED',
    branding: {
      primaryColor: '#dc2626',
      secondaryColor: '#b91c1c',
    },
    policies: { ...defaultPolicies, maxEmployees: 200 },
    settings: defaultSettings,
    employeeCount: 78,
    departmentCount: 6,
    adminEmail: 'admin@umbrella.bio',
    adminName: '이관리',
    contractStartDate: '2023-03-01',
    contractEndDate: '2025-02-28',
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'tenant-005',
    code: 'STARK',
    name: '스타크 인더스트리',
    nameEn: 'Stark Industries',
    description: '첨단 기술 연구개발',
    logoUrl: undefined,
    status: 'PENDING',
    branding: {
      primaryColor: '#ea580c',
      secondaryColor: '#c2410c',
    },
    policies: { ...defaultPolicies, maxEmployees: 1000 },
    settings: defaultSettings,
    employeeCount: 0,
    departmentCount: 0,
    adminEmail: 'admin@stark.tech',
    adminName: '최관리',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

function toListItem(tenant: TenantDetail): TenantListItem {
  return {
    id: tenant.id,
    code: tenant.code,
    name: tenant.name,
    status: tenant.status,
    employeeCount: tenant.employeeCount,
    adminEmail: tenant.adminEmail,
    createdAt: tenant.createdAt,
  };
}

export const tenantHandlers = [
  // Get tenants list
  http.get('/api/v1/tenants', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status') as TenantStatus | null;

    let filtered = [...mockTenants];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        t => t.code.toLowerCase().includes(lower) ||
             t.name.toLowerCase().includes(lower) ||
             (t.adminEmail && t.adminEmail.toLowerCase().includes(lower))
      );
    }

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toListItem);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get tenant detail
  http.get('/api/v1/tenants/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const tenant = mockTenants.find(t => t.id === id);

    if (!tenant) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_001', message: '테넌트를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: tenant,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create tenant
  http.post('/api/v1/tenants', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newTenant: TenantDetail = {
      id: `tenant-${Date.now()}`,
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      description: body.description as string | undefined,
      status: 'PENDING',
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
      },
      policies: body.policies as TenantPolicies || defaultPolicies,
      settings: defaultSettings,
      employeeCount: 0,
      departmentCount: 0,
      adminEmail: body.adminEmail as string,
      adminName: body.adminName as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTenants.push(newTenant);

    return HttpResponse.json({
      success: true,
      data: newTenant,
      message: '테넌트가 생성되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update tenant
  http.put('/api/v1/tenants/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockTenants.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_001', message: '테넌트를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockTenants[index] = {
      ...mockTenants[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockTenants[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Change tenant status
  http.post('/api/v1/tenants/:id/status', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockTenants.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_001', message: '테넌트를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockTenants[index].status = body.status as TenantStatus;
    mockTenants[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: mockTenants[index],
      message: '테넌트 상태가 변경되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete tenant
  http.delete('/api/v1/tenants/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTenants.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_001', message: '테넌트를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (mockTenants[index].employeeCount > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_002', message: '직원이 있는 테넌트는 삭제할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockTenants.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
