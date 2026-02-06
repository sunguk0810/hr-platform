import { http, HttpResponse, delay } from 'msw';
import type {
  TenantDetail,
  TenantListItem,
  TenantStatus,
  TenantPolicies,
  TenantSettings,
  TenantTreeNode,
  TenantFeature,
  FeatureCode,
  PolicyType,
  TenantLevel,
  PasswordPolicy,
  SecurityPolicy,
  NotificationPolicy,
  OrganizationPolicy,
  PolicyChangeHistory,
  LeavePolicy,
  AttendancePolicy,
  ApprovalPolicy,
  OrganizationLevel,
} from '@hr-platform/shared-types';

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  expiryDays: 90,
  historyCount: 3,
};

const defaultSecurityPolicy: SecurityPolicy = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaEnabled: false,
  ipWhitelistEnabled: false,
  allowedIps: [],
};

const defaultNotificationPolicy: NotificationPolicy = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

const defaultOrganizationPolicy: OrganizationPolicy = {
  maxDepartmentLevel: 5,
  positionRequired: true,
  gradeRequired: true,
  allowMultipleDepartments: false,
};

// SDD 3.3.1 기준 휴가 정책
const defaultLeavePolicy: LeavePolicy = {
  annualLeave: {
    baseDays: 15,
    additionalDaysPerYear: 1,
    maxAnnualDays: 25,
    carryoverAllowed: true,
    carryoverMaxDays: 10,
    carryoverExpireMonths: 3,
  },
  leaveTypes: [
    {
      code: 'ANNUAL',
      name: '연차',
      paid: true,
      requiresApproval: true,
      minDays: 0.5,
      maxConsecutiveDays: 30,
    },
    {
      code: 'SICK',
      name: '병가',
      paid: true,
      requiresApproval: true,
      requiresDocument: true,
      documentRequiredDays: 3,
    },
    {
      code: 'SPECIAL',
      name: '특별휴가',
      paid: true,
      requiresApproval: true,
    },
  ],
  approvalRules: {
    daysThreshold: [
      { maxDays: 3, approvalLevels: 1 },
      { maxDays: 7, approvalLevels: 2 },
      { maxDays: 999, approvalLevels: 3 },
    ],
  },
};

// SDD 3.3.3 기준 근태 정책
const defaultAttendancePolicy: AttendancePolicy = {
  workHours: {
    standardHoursPerDay: 8,
    standardHoursPerWeek: 40,
    maxHoursPerWeek: 52,
    flexTimeEnabled: true,
  },
  coreTime: {
    enabled: true,
    start: '10:00',
    end: '16:00',
  },
  overtime: {
    requiresApproval: true,
    maxHoursPerMonth: 52,
    autoCalculate: true,
  },
  latePolicy: {
    gracePeriodMinutes: 10,
    penaltyEnabled: false,
  },
};

// SDD 3.3.2 기준 결재 정책
const defaultApprovalPolicy: ApprovalPolicy = {
  features: {
    parallelApproval: true,
    consensus: true,
    directApproval: true,
    proxyApproval: true,
    autoApprovalLine: true,
    conditionalBranch: false,
  },
  autoApprovalLine: {
    enabled: true,
    baseOn: 'ORGANIZATION',
    maxLevels: 3,
  },
  escalation: {
    enabled: true,
    reminderAfterHours: 24,
    escalateAfterHours: 72,
    autoRejectAfterHours: 168,
  },
  proxyRules: {
    maxDurationDays: 30,
    requiresApproval: true,
    allowedScope: ['LEAVE', 'EXPENSE', 'DOCUMENT'],
  },
};

// 기본 조직 계층
const defaultHierarchyLevels: OrganizationLevel[] = [
  { levelName: '사업부', levelOrder: 1, isRequired: true },
  { levelName: '본부', levelOrder: 2, isRequired: true },
  { levelName: '부서', levelOrder: 3, isRequired: true },
  { levelName: '팀', levelOrder: 4, isRequired: false },
  { levelName: '파트', levelOrder: 5, isRequired: false },
];

const defaultPolicies: TenantPolicies = {
  maxEmployees: 500,
  maxDepartments: 50,
  allowedModules: ['EMPLOYEE', 'ORGANIZATION', 'ATTENDANCE', 'LEAVE', 'APPROVAL', 'MDM', 'NOTIFICATION'],
  leavePolicy: defaultLeavePolicy,
  attendancePolicy: defaultAttendancePolicy,
  approvalPolicy: defaultApprovalPolicy,
  passwordPolicy: defaultPasswordPolicy,
  securityPolicy: defaultSecurityPolicy,
  notificationPolicy: defaultNotificationPolicy,
  organizationPolicy: defaultOrganizationPolicy,
};

const defaultSettings: TenantSettings = {
  locale: 'ko',
  timezone: 'Asia/Seoul',
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm',
  currency: 'KRW',
  fiscalYearStartMonth: 1,
};

const defaultFeatures: TenantFeature[] = [
  {
    code: 'PARALLEL_APPROVAL',
    enabled: false,
    config: { minApprovers: 'all', approvalMode: 'and' },
  },
  {
    code: 'CONSENSUS',
    enabled: true,
    config: { consensusTypes: ['협조', '검토'], isBlocking: false },
  },
  {
    code: 'DIRECT_APPROVAL',
    enabled: true,
    config: { maxAmount: 0, allowedDocTypes: [] },
  },
  {
    code: 'PROXY_APPROVAL',
    enabled: false,
    config: { maxDays: 30, allowedDocTypes: [], requireReason: true },
  },
  {
    code: 'AUTO_APPROVAL_LINE',
    enabled: false,
    config: { defaultLines: [] },
  },
  {
    code: 'CONDITIONAL_BRANCH',
    enabled: false,
    config: { conditions: [] },
  },
  {
    code: 'OKR',
    enabled: false,
    config: { evaluationCycle: 'quarterly', maxKeyResultsPerObjective: 5, allowSelfEvaluation: true },
  },
  {
    code: 'KPI',
    enabled: false,
    config: { evaluationCycle: 'quarterly', ratingScale: 5, weightingEnabled: true, maxIndicatorsPerEmployee: 10 },
  },
];

// 계층 구조를 포함한 Mock 데이터
const mockTenants: TenantDetail[] = [
  // 그룹사 1: 아크미 그룹
  {
    id: 'group-001',
    code: 'ACME_GROUP',
    name: '아크미그룹',
    nameEn: 'ACME Group',
    description: '아크미 그룹 지주회사',
    businessNumber: '110-81-12345',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#1e40af',
      secondaryColor: '#1d4ed8',
    },
    policies: { ...defaultPolicies, maxEmployees: 10000 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 45,
    departmentCount: 5,
    adminEmail: 'admin@acme-group.co.kr',
    adminName: '그룹관리자',
    contractStartDate: '2022-01-01',
    contractEndDate: '2027-12-31',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    parentId: undefined,
    parentName: undefined,
    level: 0,
  },
  // 아크미 그룹 계열사 1
  {
    id: 'tenant-001',
    code: 'ACME',
    name: '(주)아크미코리아',
    nameEn: 'ACME Korea Inc.',
    description: '종합 IT 솔루션 기업',
    businessNumber: '120-86-56789',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
    },
    policies: defaultPolicies,
    settings: defaultSettings,
    hierarchy: { levels: defaultHierarchyLevels },
    features: [
      {
        code: 'PARALLEL_APPROVAL',
        enabled: true,
        config: { minApprovers: 'majority', approvalMode: 'or' },
      },
      {
        code: 'CONSENSUS',
        enabled: true,
        config: { consensusTypes: ['협조', '검토', '참조'], isBlocking: true },
      },
      {
        code: 'DIRECT_APPROVAL',
        enabled: true,
        config: { maxAmount: 5000000, allowedDocTypes: ['휴가신청', '지출결의'] },
      },
      {
        code: 'PROXY_APPROVAL',
        enabled: true,
        config: { maxDays: 14, allowedDocTypes: [], requireReason: true },
      },
      {
        code: 'AUTO_APPROVAL_LINE',
        enabled: true,
        config: { defaultLines: [] },
      },
      {
        code: 'OKR',
        enabled: false,
        config: { evaluationCycle: 'quarterly', maxKeyResultsPerObjective: 5, allowSelfEvaluation: true },
      },
      {
        code: 'KPI',
        enabled: true,
        config: { evaluationCycle: 'half', ratingScale: 5, weightingEnabled: true, maxIndicatorsPerEmployee: 8 },
      },
    ],
    employeeCount: 156,
    departmentCount: 12,
    adminEmail: 'admin@acme.co.kr',
    adminName: '관리자',
    contractStartDate: '2023-01-01',
    contractEndDate: '2025-12-31',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    parentId: 'group-001',
    parentName: '아크미그룹',
    level: 1,
  },
  // 아크미 그룹 계열사 2
  {
    id: 'tenant-002',
    code: 'ACME_JP',
    name: '아크미재팬',
    nameEn: 'ACME Japan',
    description: '일본 지사',
    businessNumber: '130-87-11223',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
    },
    policies: { ...defaultPolicies, maxEmployees: 200 },
    settings: { ...defaultSettings, timezone: 'Asia/Tokyo' },
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 67,
    departmentCount: 6,
    adminEmail: 'admin@acme.jp',
    adminName: '田中',
    contractStartDate: '2023-06-01',
    contractEndDate: '2025-05-31',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    parentId: 'group-001',
    parentName: '아크미그룹',
    level: 1,
  },
  // 그룹사 2: 글로벡스 그룹
  {
    id: 'group-002',
    code: 'GLOBEX_GROUP',
    name: '글로벡스그룹',
    nameEn: 'Globex Group',
    description: '글로벌 무역 및 물류 그룹',
    businessNumber: '211-82-33445',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#047857',
      secondaryColor: '#059669',
    },
    policies: { ...defaultPolicies, maxEmployees: 5000 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 23,
    departmentCount: 3,
    adminEmail: 'admin@globex-group.com',
    adminName: '그룹매니저',
    contractStartDate: '2022-06-01',
    contractEndDate: '2026-05-31',
    createdAt: '2022-06-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    parentId: undefined,
    parentName: undefined,
    level: 0,
  },
  // 글로벡스 그룹 계열사 1
  {
    id: 'tenant-003',
    code: 'GLOBEX',
    name: '글로벡스',
    nameEn: 'Globex Corporation',
    description: '글로벌 무역 및 물류',
    businessNumber: '220-81-55667',
    logoUrl: undefined,
    status: 'ACTIVE',
    branding: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
    },
    policies: { ...defaultPolicies, maxEmployees: 300 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 89,
    departmentCount: 8,
    adminEmail: 'admin@globex.com',
    adminName: '김관리',
    contractStartDate: '2023-06-01',
    contractEndDate: '2025-05-31',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    parentId: 'group-002',
    parentName: '글로벡스그룹',
    level: 1,
  },
  // 독립 테넌트 (그룹 없음)
  {
    id: 'tenant-004',
    code: 'INITECH',
    name: '이니텍',
    nameEn: 'Initech',
    description: '소프트웨어 개발 및 컨설팅',
    businessNumber: '314-86-77889',
    logoUrl: undefined,
    status: 'INACTIVE',
    branding: {
      primaryColor: '#7c3aed',
      secondaryColor: '#6d28d9',
    },
    policies: { ...defaultPolicies, maxEmployees: 100 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 45,
    departmentCount: 5,
    adminEmail: 'admin@initech.io',
    adminName: '박관리',
    contractStartDate: '2022-01-01',
    contractEndDate: '2023-12-31',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parentId: undefined,
    parentName: undefined,
    level: 0,
  },
  {
    id: 'tenant-005',
    code: 'UMBRELLA',
    name: '엄브렐라 바이오',
    nameEn: 'Umbrella Bio',
    description: '바이오 헬스케어',
    businessNumber: '415-87-99001',
    logoUrl: undefined,
    status: 'SUSPENDED',
    branding: {
      primaryColor: '#dc2626',
      secondaryColor: '#b91c1c',
    },
    policies: { ...defaultPolicies, maxEmployees: 200 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 78,
    departmentCount: 6,
    adminEmail: 'admin@umbrella.bio',
    adminName: '이관리',
    contractStartDate: '2023-03-01',
    contractEndDate: '2025-02-28',
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    parentId: undefined,
    parentName: undefined,
    level: 0,
  },
  {
    id: 'tenant-006',
    code: 'STARK',
    name: '스타크 인더스트리',
    nameEn: 'Stark Industries',
    description: '첨단 기술 연구개발',
    businessNumber: '516-88-22334',
    logoUrl: undefined,
    status: 'PENDING',
    branding: {
      primaryColor: '#ea580c',
      secondaryColor: '#c2410c',
    },
    policies: { ...defaultPolicies, maxEmployees: 1000 },
    settings: defaultSettings,
    features: defaultFeatures,
    hierarchy: { levels: defaultHierarchyLevels },
    employeeCount: 0,
    departmentCount: 0,
    adminEmail: 'admin@stark.tech',
    adminName: '최관리',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    parentId: undefined,
    parentName: undefined,
    level: 0,
  },
];

// Mock 정책 변경 이력
const mockPolicyHistory: PolicyChangeHistory[] = [
  {
    id: 'history-001',
    tenantId: 'tenant-001',
    policyType: 'LEAVE',
    action: 'UPDATE',
    beforeValue: { annualLeaveBaseDays: 12, maxAnnualLeave: 20 },
    afterValue: { annualLeaveBaseDays: 15, maxAnnualLeave: 25 },
    changedBy: 'user-001',
    changedByName: '김관리자',
    changedAt: '2024-02-15T14:30:00Z',
    reason: '연차 정책 개선',
  },
  {
    id: 'history-002',
    tenantId: 'tenant-001',
    policyType: 'ATTENDANCE',
    action: 'UPDATE',
    beforeValue: { workStartTime: '08:30', lateGraceMinutes: 5 },
    afterValue: { workStartTime: '09:00', lateGraceMinutes: 10 },
    changedBy: 'user-001',
    changedByName: '김관리자',
    changedAt: '2024-02-10T10:00:00Z',
    reason: '유연근무제 적용',
  },
  {
    id: 'history-003',
    tenantId: 'tenant-001',
    policyType: 'PASSWORD',
    action: 'INHERIT',
    beforeValue: { minLength: 6, requireSpecialChar: false },
    afterValue: { minLength: 8, requireSpecialChar: true },
    changedBy: 'user-002',
    changedByName: '그룹관리자',
    changedAt: '2024-02-01T09:00:00Z',
    sourceId: 'group-001',
    sourceName: '아크미그룹',
  },
  {
    id: 'history-004',
    tenantId: 'tenant-001',
    policyType: 'SECURITY',
    action: 'CREATE',
    afterValue: { sessionTimeoutMinutes: 30, maxLoginAttempts: 5, mfaEnabled: false },
    changedBy: 'user-001',
    changedByName: '김관리자',
    changedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'history-005',
    tenantId: 'tenant-001',
    policyType: 'APPROVAL',
    action: 'UPDATE',
    beforeValue: { maxApprovalSteps: 3, parallelApprovalEnabled: false },
    afterValue: { maxApprovalSteps: 5, parallelApprovalEnabled: true },
    changedBy: 'user-003',
    changedByName: '박담당자',
    changedAt: '2024-01-10T16:00:00Z',
    reason: '결재 프로세스 확장',
  },
  {
    id: 'history-006',
    tenantId: 'tenant-002',
    policyType: 'LEAVE',
    action: 'INHERIT',
    afterValue: { annualLeaveBaseDays: 15, maxAnnualLeave: 25 },
    changedBy: 'user-002',
    changedByName: '그룹관리자',
    changedAt: '2024-02-20T09:30:00Z',
    sourceId: 'group-001',
    sourceName: '아크미그룹',
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
    parentId: tenant.parentId,
    parentName: tenant.parentName,
    level: tenant.level,
  };
}

// 트리 구조 생성 함수
function buildTenantTree(): TenantTreeNode[] {
  const groups = mockTenants.filter(t => t.level === 0);
  const subsidiaries = mockTenants.filter(t => t.level === 1);

  return groups.map(group => ({
    id: group.id,
    code: group.code,
    name: group.name,
    status: group.status,
    employeeCount: group.employeeCount,
    level: group.level,
    children: subsidiaries
      .filter(s => s.parentId === group.id)
      .map(sub => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        status: sub.status,
        employeeCount: sub.employeeCount,
        level: sub.level,
        children: [],
      })),
  }));
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
    const parentId = url.searchParams.get('parentId') || '';
    const level = url.searchParams.get('level');

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

    if (parentId) {
      filtered = filtered.filter(t => t.parentId === parentId);
    }

    if (level !== null && level !== '') {
      const levelNum = parseInt(level, 10) as TenantLevel;
      filtered = filtered.filter(t => t.level === levelNum);
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

  // Get tenant tree
  http.get('/api/v1/tenants/tree', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: buildTenantTree(),
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

  // Get subsidiaries
  http.get('/api/v1/tenants/:id/subsidiaries', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const subsidiaries = mockTenants
      .filter(t => t.parentId === id)
      .map(toListItem);

    return HttpResponse.json({
      success: true,
      data: subsidiaries,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get features
  http.get('/api/v1/tenants/:id/features', async ({ params }) => {
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
      data: tenant.features,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create tenant
  http.post('/api/v1/tenants', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const parentId = body.parentId as string | undefined;
    const parentTenant = parentId ? mockTenants.find(t => t.id === parentId) : undefined;

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
      features: [...defaultFeatures],
      employeeCount: 0,
      departmentCount: 0,
      adminEmail: body.adminEmail as string,
      adminName: body.adminName as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: parentId,
      parentName: parentTenant?.name,
      level: parentId ? 1 : 0,
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

  // Update policy
  http.put('/api/v1/tenants/:id/policies/:policyType', async ({ params, request }) => {
    await delay(300);

    const { id, policyType } = params;
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
    const policyKey = `${policyType}Policy` as keyof TenantPolicies;

    if (policyKey in mockTenants[index].policies) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockTenants[index].policies as any)[policyKey] = body;
      mockTenants[index].updatedAt = new Date().toISOString();
    }

    return HttpResponse.json({
      success: true,
      data: null,
      message: '정책이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Toggle feature
  http.put('/api/v1/tenants/:id/features/:code', async ({ params, request }) => {
    await delay(300);

    const { id, code } = params;
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

    const body = await request.json() as { enabled: boolean; config?: Record<string, unknown> };
    const featureIndex = mockTenants[index].features.findIndex(f => f.code === code);

    if (featureIndex !== -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockTenants[index].features[featureIndex] = {
        ...mockTenants[index].features[featureIndex],
        enabled: body.enabled,
        config: body.config as any,
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockTenants[index].features.push({
        code: code as FeatureCode,
        enabled: body.enabled,
        config: body.config as any,
      });
    }

    mockTenants[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: null,
      message: '기능이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Upload branding image
  http.post('/api/v1/tenants/:id/branding/images', async ({ params }) => {
    await delay(500);

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

    // 실제로는 파일을 저장하고 URL을 반환
    const mockUrl = `https://storage.example.com/tenants/${id}/branding/${Date.now()}.png`;

    return HttpResponse.json({
      success: true,
      data: { url: mockUrl },
      message: '이미지가 업로드되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Update branding
  http.put('/api/v1/tenants/:id/branding', async ({ params, request }) => {
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
    mockTenants[index].branding = {
      ...mockTenants[index].branding,
      ...body,
    };
    mockTenants[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: null,
      message: '브랜딩이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Inherit policies
  http.post('/api/v1/tenants/:id/inherit-policies', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const parentIndex = mockTenants.findIndex(t => t.id === id);

    if (parentIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TNT_001', message: '테넌트를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as { childIds: string[]; policyTypes: PolicyType[] };
    const parentTenant = mockTenants[parentIndex];

    // 선택된 계열사들에 정책 복사
    body.childIds.forEach(childId => {
      const childIndex = mockTenants.findIndex(t => t.id === childId);
      if (childIndex !== -1) {
        body.policyTypes.forEach(policyType => {
          const policyKey = `${policyType.toLowerCase()}Policy` as keyof TenantPolicies;
          if (policyKey in parentTenant.policies) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mockTenants[childIndex].policies as any)[policyKey] =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              JSON.parse(JSON.stringify((parentTenant.policies as any)[policyKey]));
          }
        });
        mockTenants[childIndex].updatedAt = new Date().toISOString();
      }
    });

    return HttpResponse.json({
      success: true,
      data: null,
      message: '정책이 상속되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Update modules
  http.put('/api/v1/tenants/:id/modules', async ({ params, request }) => {
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

    const body = await request.json() as { modules: string[] };
    mockTenants[index].policies.allowedModules = body.modules;
    mockTenants[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: null,
      message: '모듈 설정이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get policy history
  http.get('/api/v1/tenants/:id/policy-history', async ({ params, request }) => {
    await delay(200);

    const { id } = params;
    const url = new URL(request.url);
    const policyType = url.searchParams.get('policyType') as PolicyType | null;

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

    let history = mockPolicyHistory.filter(h => h.tenantId === id);

    if (policyType) {
      history = history.filter(h => h.policyType === policyType);
    }

    // 최신순 정렬
    history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    return HttpResponse.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get hierarchy
  http.get('/api/v1/tenants/:id/hierarchy', async ({ params }) => {
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
      data: tenant.hierarchy || { levels: defaultHierarchyLevels },
      timestamp: new Date().toISOString(),
    });
  }),

  // Update hierarchy
  http.put('/api/v1/tenants/:id/hierarchy', async ({ params, request }) => {
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

    const body = await request.json() as { levels: OrganizationLevel[] };
    mockTenants[index].hierarchy = { levels: body.levels };
    mockTenants[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: null,
      message: '조직 계층이 수정되었습니다.',
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

  // Get current tenant feature config
  http.get('/api/v1/tenants/current/features/:code', async ({ params }) => {
    await delay(200);

    const { code } = params;
    // Use tenant-001 as the current tenant
    const tenant = mockTenants.find(t => t.id === 'tenant-001');

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

    const feature = tenant.features.find(f => f.code === code);

    if (!feature) {
      return HttpResponse.json({
        success: true,
        data: { code, enabled: false, config: null },
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json({
      success: true,
      data: feature,
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

    // 그룹사인 경우 계열사가 있으면 삭제 불가
    if (mockTenants[index].level === 0) {
      const hasSubsidiaries = mockTenants.some(t => t.parentId === id);
      if (hasSubsidiaries) {
        return HttpResponse.json(
          {
            success: false,
            error: { code: 'TNT_003', message: '계열사가 있는 그룹사는 삭제할 수 없습니다.' },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    mockTenants.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
