import { http, HttpResponse, delay } from 'msw';
import type { CodeGroup, CodeGroupListItem, CommonCode, CommonCodeListItem } from '@hr-platform/shared-types';

const mockCodeGroups: CodeGroup[] = [
  {
    id: 'cg-001',
    tenantId: 'tenant-001',
    code: 'LEAVE_TYPE',
    name: '휴가유형',
    nameEn: 'Leave Type',
    description: '휴가의 종류를 정의합니다.',
    isSystem: true,
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-002',
    tenantId: 'tenant-001',
    code: 'EMPLOYMENT_STATUS',
    name: '고용상태',
    nameEn: 'Employment Status',
    description: '직원의 고용 상태를 정의합니다.',
    isSystem: true,
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-003',
    tenantId: 'tenant-001',
    code: 'GENDER',
    name: '성별',
    nameEn: 'Gender',
    description: '성별 코드를 정의합니다.',
    isSystem: true,
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-004',
    tenantId: 'tenant-001',
    code: 'APPROVAL_TYPE',
    name: '결재유형',
    nameEn: 'Approval Type',
    description: '전자결재 문서 유형을 정의합니다.',
    isSystem: true,
    sortOrder: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-005',
    tenantId: 'tenant-001',
    code: 'POSITION',
    name: '직책',
    nameEn: 'Position',
    description: '직원의 직책을 정의합니다.',
    isSystem: false,
    sortOrder: 5,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-006',
    tenantId: 'tenant-001',
    code: 'GRADE',
    name: '직급',
    nameEn: 'Grade',
    description: '직원의 직급을 정의합니다.',
    isSystem: false,
    sortOrder: 6,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-007',
    tenantId: 'tenant-001',
    code: 'CONTRACT_TYPE',
    name: '계약유형',
    nameEn: 'Contract Type',
    description: '고용 계약 유형을 정의합니다.',
    isSystem: false,
    sortOrder: 7,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-008',
    tenantId: 'tenant-001',
    code: 'EDUCATION_LEVEL',
    name: '학력',
    nameEn: 'Education Level',
    description: '학력 수준을 정의합니다.',
    isSystem: false,
    sortOrder: 8,
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

const mockCommonCodes: CommonCode[] = [
  // Leave Types
  { id: 'cc-001', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'ANNUAL', name: '연차', nameEn: 'Annual Leave', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-002', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'SICK', name: '병가', nameEn: 'Sick Leave', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-003', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'SPECIAL', name: '특별휴가', nameEn: 'Special Leave', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-004', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_AM', name: '반차(오전)', nameEn: 'Half Day (AM)', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-005', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_PM', name: '반차(오후)', nameEn: 'Half Day (PM)', sortOrder: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-006', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY', name: '출산휴가', nameEn: 'Maternity Leave', sortOrder: 6, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-007', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'PATERNITY', name: '배우자출산휴가', nameEn: 'Paternity Leave', sortOrder: 7, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-008', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'UNPAID', name: '무급휴가', nameEn: 'Unpaid Leave', sortOrder: 8, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Employment Status
  { id: 'cc-011', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'ACTIVE', name: '재직', nameEn: 'Active', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-012', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'ON_LEAVE', name: '휴직', nameEn: 'On Leave', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-013', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'RESIGNED', name: '퇴직', nameEn: 'Resigned', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-014', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'RETIRED', name: '정년퇴직', nameEn: 'Retired', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Gender
  { id: 'cc-021', tenantId: 'tenant-001', groupId: 'cg-003', groupCode: 'GENDER', code: 'MALE', name: '남성', nameEn: 'Male', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-022', tenantId: 'tenant-001', groupId: 'cg-003', groupCode: 'GENDER', code: 'FEMALE', name: '여성', nameEn: 'Female', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Approval Types
  { id: 'cc-031', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'LEAVE_REQUEST', name: '휴가신청', nameEn: 'Leave Request', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-032', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE', name: '경비청구', nameEn: 'Expense', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-033', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'OVERTIME', name: '초과근무신청', nameEn: 'Overtime', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-034', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'PERSONNEL', name: '인사관련', nameEn: 'Personnel', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-035', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'GENERAL', name: '일반기안', nameEn: 'General', sortOrder: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Positions
  { id: 'cc-041', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'TEAM_LEADER', name: '팀장', nameEn: 'Team Leader', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-042', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'SENIOR', name: '선임', nameEn: 'Senior', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-043', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'MANAGER', name: '매니저', nameEn: 'Manager', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-044', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'STAFF', name: '사원', nameEn: 'Staff', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Grades
  { id: 'cc-051', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G1', name: '부장', nameEn: 'Director', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-052', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G2', name: '차장', nameEn: 'Deputy Director', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-053', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G3', name: '과장', nameEn: 'Manager', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-054', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G4', name: '대리', nameEn: 'Assistant Manager', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-055', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G5', name: '사원', nameEn: 'Staff', sortOrder: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Contract Types
  { id: 'cc-061', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'PERMANENT', name: '정규직', nameEn: 'Permanent', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-062', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'CONTRACT', name: '계약직', nameEn: 'Contract', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-063', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'INTERN', name: '인턴', nameEn: 'Intern', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-064', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'PART_TIME', name: '파트타임', nameEn: 'Part-time', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

function toCodeGroupListItem(group: CodeGroup): CodeGroupListItem {
  const codeCount = mockCommonCodes.filter(c => c.groupCode === group.code).length;
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    isSystem: group.isSystem,
    isActive: group.isActive,
    codeCount,
  };
}

function toCommonCodeListItem(code: CommonCode): CommonCodeListItem {
  return {
    id: code.id,
    groupCode: code.groupCode,
    code: code.code,
    name: code.name,
    nameEn: code.nameEn,
    sortOrder: code.sortOrder,
    isActive: code.isActive,
    parentCode: code.parentCode,
  };
}

export const mdmHandlers = [
  // Get code groups list
  http.get('/api/v1/mdm/code-groups', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const isActive = url.searchParams.get('isActive');

    let filtered = [...mockCodeGroups];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        g => g.code.toLowerCase().includes(lower) ||
             g.name.toLowerCase().includes(lower)
      );
    }

    if (isActive !== null && isActive !== '') {
      filtered = filtered.filter(g => g.isActive === (isActive === 'true'));
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toCodeGroupListItem);

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

  // Get code group detail
  http.get('/api/v1/mdm/code-groups/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const group = mockCodeGroups.find(g => g.id === id);

    if (!group) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_001', message: '코드그룹을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: group,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create code group
  http.post('/api/v1/mdm/code-groups', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const newGroup: CodeGroup = {
      id: `cg-${Date.now()}`,
      tenantId: 'tenant-001',
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      description: body.description as string | undefined,
      isSystem: false,
      sortOrder: mockCodeGroups.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCodeGroups.push(newGroup);

    return HttpResponse.json({
      success: true,
      data: newGroup,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update code group
  http.put('/api/v1/mdm/code-groups/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockCodeGroups.findIndex(g => g.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_001', message: '코드그룹을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockCodeGroups[index] = {
      ...mockCodeGroups[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockCodeGroups[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete code group
  http.delete('/api/v1/mdm/code-groups/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockCodeGroups.findIndex(g => g.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_001', message: '코드그룹을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (mockCodeGroups[index].isSystem) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_002', message: '시스템 코드그룹은 삭제할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockCodeGroups.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get common codes list
  http.get('/api/v1/mdm/common-codes', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const groupCode = url.searchParams.get('groupCode') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const isActive = url.searchParams.get('isActive');

    let filtered = [...mockCommonCodes];

    if (groupCode) {
      filtered = filtered.filter(c => c.groupCode === groupCode);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        c => c.code.toLowerCase().includes(lower) ||
             c.name.toLowerCase().includes(lower)
      );
    }

    if (isActive !== null && isActive !== '') {
      filtered = filtered.filter(c => c.isActive === (isActive === 'true'));
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toCommonCodeListItem);

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

  // Get codes by group (for dropdowns)
  http.get('/api/v1/mdm/codes/:groupCode', async ({ params }) => {
    await delay(200);

    const { groupCode } = params;
    const codes = mockCommonCodes
      .filter(c => c.groupCode === groupCode && c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({ value: c.code, label: c.name, labelEn: c.nameEn }));

    return HttpResponse.json({
      success: true,
      data: codes,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get common code detail
  http.get('/api/v1/mdm/common-codes/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const code = mockCommonCodes.find(c => c.id === id);

    if (!code) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_003', message: '공통코드를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: code,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create common code
  http.post('/api/v1/mdm/common-codes', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const group = mockCodeGroups.find(g => g.id === body.groupId);

    if (!group) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_001', message: '코드그룹을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const newCode: CommonCode = {
      id: `cc-${Date.now()}`,
      tenantId: 'tenant-001',
      groupId: body.groupId as string,
      groupCode: group.code,
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      description: body.description as string | undefined,
      sortOrder: (body.sortOrder as number) || mockCommonCodes.filter(c => c.groupCode === group.code).length + 1,
      isActive: true,
      parentCode: body.parentCode as string | undefined,
      attributes: body.attributes as Record<string, string> | undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCommonCodes.push(newCode);

    return HttpResponse.json({
      success: true,
      data: newCode,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update common code
  http.put('/api/v1/mdm/common-codes/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockCommonCodes.findIndex(c => c.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_003', message: '공통코드를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockCommonCodes[index] = {
      ...mockCommonCodes[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockCommonCodes[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete common code
  http.delete('/api/v1/mdm/common-codes/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockCommonCodes.findIndex(c => c.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_003', message: '공통코드를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockCommonCodes.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
