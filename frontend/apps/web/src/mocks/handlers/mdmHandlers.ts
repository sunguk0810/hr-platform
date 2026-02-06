import { http, HttpResponse, delay } from 'msw';
import type {
  CodeGroup,
  CodeGroupListItem,
  CommonCode,
  CommonCodeListItem,
  CodeStatus,
  CodeHistory,
  CodeHistoryAction,
  CodeSearchResult,
  CodeTreeNode,
  TenantCodeSetting,
} from '@hr-platform/shared-types';

// Code history storage
const mockCodeHistory: CodeHistory[] = [
  {
    id: 'ch-001',
    codeId: 'cc-001',
    groupCode: 'LEAVE_TYPE',
    code: 'ANNUAL',
    action: 'CREATE',
    changedBy: '관리자',
    changedAt: '2024-01-01T09:00:00Z',
  },
  {
    id: 'ch-002',
    codeId: 'cc-001',
    groupCode: 'LEAVE_TYPE',
    code: 'ANNUAL',
    action: 'UPDATE',
    fieldName: 'codeName',
    oldValue: '연차휴가',
    newValue: '연차',
    changedBy: '관리자',
    changedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'ch-003',
    codeId: 'cc-001',
    groupCode: 'LEAVE_TYPE',
    code: 'ANNUAL',
    action: 'ACTIVATE',
    fieldName: 'status',
    oldValue: 'INACTIVE',
    newValue: 'ACTIVE',
    changedBy: '김인사',
    changedAt: '2024-02-01T10:00:00Z',
    changeReason: '휴가 시즌 시작으로 활성화',
  },
];

// Tenant code settings storage
const mockTenantCodeSettings: TenantCodeSetting[] = [
  {
    id: 'tcs-001',
    codeId: 'cc-001',
    groupCode: 'LEAVE_TYPE',
    code: 'ANNUAL',
    originalName: '연차',
    customName: '연차휴가',
    enabled: true,
    sortOrder: 1,
    tenantId: 'tenant-001',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tcs-002',
    codeId: 'cc-002',
    groupCode: 'LEAVE_TYPE',
    code: 'SICK',
    originalName: '병가',
    enabled: true,
    sortOrder: 2,
    tenantId: 'tenant-001',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tcs-003',
    codeId: 'cc-008',
    groupCode: 'LEAVE_TYPE',
    code: 'UNPAID',
    originalName: '무급휴가',
    customName: '무급휴직',
    enabled: false,
    sortOrder: 8,
    tenantId: 'tenant-001',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

// Code status storage (extend CommonCode)
const codeStatusMap: Map<string, CodeStatus> = new Map();

const mockCodeGroups: CodeGroup[] = [
  {
    id: 'cg-001',
    tenantId: 'tenant-001',
    groupCode: 'LEAVE_TYPE',
    groupName: '휴가유형',
    groupNameEn: 'Leave Type',
    description: '휴가의 종류를 정의합니다.',
    system: true,
    hierarchical: true,
    sortOrder: 1,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-002',
    tenantId: 'tenant-001',
    groupCode: 'EMPLOYMENT_STATUS',
    groupName: '고용상태',
    groupNameEn: 'Employment Status',
    description: '직원의 고용 상태를 정의합니다.',
    system: true,
    hierarchical: false,
    sortOrder: 2,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-003',
    tenantId: 'tenant-001',
    groupCode: 'GENDER',
    groupName: '성별',
    groupNameEn: 'Gender',
    description: '성별 코드를 정의합니다.',
    system: true,
    hierarchical: false,
    sortOrder: 3,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-004',
    tenantId: 'tenant-001',
    groupCode: 'APPROVAL_TYPE',
    groupName: '결재유형',
    groupNameEn: 'Approval Type',
    description: '전자결재 문서 유형을 정의합니다.',
    system: true,
    hierarchical: true,
    sortOrder: 4,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-005',
    tenantId: 'tenant-001',
    groupCode: 'POSITION',
    groupName: '직책',
    groupNameEn: 'Position',
    description: '직원의 직책을 정의합니다.',
    system: false,
    hierarchical: false,
    sortOrder: 5,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-006',
    tenantId: 'tenant-001',
    groupCode: 'GRADE',
    groupName: '직급',
    groupNameEn: 'Grade',
    description: '직원의 직급을 정의합니다.',
    system: false,
    hierarchical: false,
    sortOrder: 6,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-007',
    tenantId: 'tenant-001',
    groupCode: 'CONTRACT_TYPE',
    groupName: '계약유형',
    groupNameEn: 'Contract Type',
    description: '고용 계약 유형을 정의합니다.',
    system: false,
    hierarchical: false,
    sortOrder: 7,
    status: 'ACTIVE',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cg-008',
    tenantId: 'tenant-001',
    groupCode: 'EDUCATION_LEVEL',
    groupName: '학력',
    groupNameEn: 'Education Level',
    description: '학력 수준을 정의합니다.',
    system: false,
    hierarchical: false,
    sortOrder: 8,
    status: 'INACTIVE',
    active: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

const mockCommonCodes: CommonCode[] = [
  // Leave Types - with 4-level classification hierarchy
  // Level 1 (대분류): 휴가
  { id: 'cc-001', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'ANNUAL', codeName: '연차', codeNameEn: 'Annual Leave', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-002', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'SICK', codeName: '병가', codeNameEn: 'Sick Leave', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-003', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'SPECIAL', codeName: '특별휴가', codeNameEn: 'Special Leave', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 연차 하위
  { id: 'cc-004', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_AM', codeName: '반차(오전)', codeNameEn: 'Half Day (AM)', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-001', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-005', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_PM', codeName: '반차(오후)', codeNameEn: 'Half Day (PM)', sortOrder: 5, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-001', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 특별휴가 하위
  { id: 'cc-006', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY', codeName: '출산휴가', codeNameEn: 'Maternity Leave', sortOrder: 6, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-003', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-007', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'PATERNITY', codeName: '배우자출산휴가', codeNameEn: 'Paternity Leave', sortOrder: 7, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-003', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 3 (소분류): 출산휴가 하위
  { id: 'cc-006-1', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_PRE', codeName: '출산전 휴가', codeNameEn: 'Pre-Maternity Leave', sortOrder: 61, active: true, status: 'ACTIVE', defaultCode: false, level: 3, parentCodeId: 'cc-006', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-006-2', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_POST', codeName: '출산후 휴가', codeNameEn: 'Post-Maternity Leave', sortOrder: 62, active: true, status: 'ACTIVE', defaultCode: false, level: 3, parentCodeId: 'cc-006', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 4 (세분류): 출산전 휴가 하위
  { id: 'cc-006-1-1', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_PRE_PAID', codeName: '유급 출산전 휴가', codeNameEn: 'Paid Pre-Maternity', sortOrder: 611, active: true, status: 'ACTIVE', defaultCode: false, level: 4, parentCodeId: 'cc-006-1', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-008', tenantId: 'tenant-001', groupCode: 'LEAVE_TYPE', code: 'UNPAID', codeName: '무급휴가', codeNameEn: 'Unpaid Leave', sortOrder: 8, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Employment Status (flat - level 1 only)
  { id: 'cc-011', tenantId: 'tenant-001', groupCode: 'EMPLOYMENT_STATUS', code: 'ACTIVE', codeName: '재직', codeNameEn: 'Active', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: true, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-012', tenantId: 'tenant-001', groupCode: 'EMPLOYMENT_STATUS', code: 'ON_LEAVE', codeName: '휴직', codeNameEn: 'On Leave', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-013', tenantId: 'tenant-001', groupCode: 'EMPLOYMENT_STATUS', code: 'RESIGNED', codeName: '퇴직', codeNameEn: 'Resigned', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-014', tenantId: 'tenant-001', groupCode: 'EMPLOYMENT_STATUS', code: 'RETIRED', codeName: '정년퇴직', codeNameEn: 'Retired', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Gender (flat - level 1 only)
  { id: 'cc-021', tenantId: 'tenant-001', groupCode: 'GENDER', code: 'MALE', codeName: '남성', codeNameEn: 'Male', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-022', tenantId: 'tenant-001', groupCode: 'GENDER', code: 'FEMALE', codeName: '여성', codeNameEn: 'Female', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Approval Types - with hierarchy
  // Level 1 (대분류)
  { id: 'cc-031', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'LEAVE_REQUEST', codeName: '휴가신청', codeNameEn: 'Leave Request', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-032', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE', codeName: '경비청구', codeNameEn: 'Expense', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-033', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'OVERTIME', codeName: '초과근무신청', codeNameEn: 'Overtime', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-034', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'PERSONNEL', codeName: '인사관련', codeNameEn: 'Personnel', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-035', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'GENERAL', codeName: '일반기안', codeNameEn: 'General', sortOrder: 5, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 경비청구 하위
  { id: 'cc-032-1', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE_TRAVEL', codeName: '출장경비', codeNameEn: 'Travel Expense', sortOrder: 21, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-032', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-032-2', tenantId: 'tenant-001', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE_SUPPLY', codeName: '비품구매', codeNameEn: 'Supply Expense', sortOrder: 22, active: true, status: 'ACTIVE', defaultCode: false, level: 2, parentCodeId: 'cc-032', effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Positions (flat)
  { id: 'cc-041', tenantId: 'tenant-001', groupCode: 'POSITION', code: 'TEAM_LEADER', codeName: '팀장', codeNameEn: 'Team Leader', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-042', tenantId: 'tenant-001', groupCode: 'POSITION', code: 'SENIOR', codeName: '선임', codeNameEn: 'Senior', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-043', tenantId: 'tenant-001', groupCode: 'POSITION', code: 'MANAGER', codeName: '매니저', codeNameEn: 'Manager', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-044', tenantId: 'tenant-001', groupCode: 'POSITION', code: 'STAFF', codeName: '사원', codeNameEn: 'Staff', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Grades (flat)
  { id: 'cc-051', tenantId: 'tenant-001', groupCode: 'GRADE', code: 'G1', codeName: '부장', codeNameEn: 'Director', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-052', tenantId: 'tenant-001', groupCode: 'GRADE', code: 'G2', codeName: '차장', codeNameEn: 'Deputy Director', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-053', tenantId: 'tenant-001', groupCode: 'GRADE', code: 'G3', codeName: '과장', codeNameEn: 'Manager', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-054', tenantId: 'tenant-001', groupCode: 'GRADE', code: 'G4', codeName: '대리', codeNameEn: 'Assistant Manager', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-055', tenantId: 'tenant-001', groupCode: 'GRADE', code: 'G5', codeName: '사원', codeNameEn: 'Staff', sortOrder: 5, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Contract Types (flat)
  { id: 'cc-061', tenantId: 'tenant-001', groupCode: 'CONTRACT_TYPE', code: 'PERMANENT', codeName: '정규직', codeNameEn: 'Permanent', sortOrder: 1, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-062', tenantId: 'tenant-001', groupCode: 'CONTRACT_TYPE', code: 'CONTRACT', codeName: '계약직', codeNameEn: 'Contract', sortOrder: 2, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-063', tenantId: 'tenant-001', groupCode: 'CONTRACT_TYPE', code: 'INTERN', codeName: '인턴', codeNameEn: 'Intern', sortOrder: 3, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-064', tenantId: 'tenant-001', groupCode: 'CONTRACT_TYPE', code: 'PART_TIME', codeName: '파트타임', codeNameEn: 'Part-time', sortOrder: 4, active: true, status: 'ACTIVE', defaultCode: false, level: 1, effective: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

function toCodeGroupListItem(group: CodeGroup): CodeGroupListItem {
  const codeCount = mockCommonCodes.filter(c => c.groupCode === group.groupCode).length;
  return {
    id: group.id,
    groupCode: group.groupCode,
    groupName: group.groupName,
    description: group.description,
    system: group.system,
    active: group.active,
    status: group.status,
    codeCount,
  };
}

function toCommonCodeListItem(code: CommonCode): CommonCodeListItem {
  return {
    id: code.id,
    groupCode: code.groupCode,
    code: code.code,
    codeName: code.codeName,
    codeNameEn: code.codeNameEn,
    sortOrder: code.sortOrder,
    active: code.active,
    status: code.status,
    level: code.level,
    parentCodeId: code.parentCodeId,
    defaultCode: code.defaultCode,
  };
}

export const mdmHandlers = [
  // Get code groups list (returns plain array, not PageResponse)
  http.get('/api/v1/mdm/code-groups', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const active = url.searchParams.get('active');

    let filtered = [...mockCodeGroups];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        g => g.groupCode.toLowerCase().includes(lower) ||
             g.groupName.toLowerCase().includes(lower)
      );
    }

    if (active !== null && active !== '') {
      filtered = filtered.filter(g => g.active === (active === 'true'));
    }

    const content = filtered.map(toCodeGroupListItem);

    return HttpResponse.json({
      success: true,
      data: content,
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
      groupCode: body.groupCode as string,
      groupName: body.groupName as string,
      groupNameEn: body.groupNameEn as string | undefined,
      description: body.description as string | undefined,
      system: false,
      hierarchical: (body.hierarchical as boolean) ?? false,
      sortOrder: mockCodeGroups.length + 1,
      status: 'ACTIVE',
      active: true,
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

    if (mockCodeGroups[index].system) {
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

  // Get common codes list (PageResponse, with status filter instead of isActive)
  http.get('/api/v1/mdm/common-codes', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const groupCode = url.searchParams.get('groupCode') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status');

    let filtered = [...mockCommonCodes];

    if (groupCode) {
      filtered = filtered.filter(c => c.groupCode === groupCode);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        c => c.code.toLowerCase().includes(lower) ||
             c.codeName.toLowerCase().includes(lower)
      );
    }

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toCommonCodeListItem);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page: {
          number: page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get codes by group (for dropdowns)
  http.get('/api/v1/mdm/common-codes/group/:groupCode', async ({ params }) => {
    await delay(200);

    const { groupCode } = params;
    const codes = mockCommonCodes
      .filter(c => c.groupCode === groupCode && c.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({ value: c.code, label: c.codeName, labelEn: c.codeNameEn }));

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
    const groupCode = body.groupCode as string || '';
    const group = mockCodeGroups.find(g => g.groupCode === groupCode);

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
      groupCode: group.groupCode,
      code: body.code as string,
      codeName: body.codeName as string,
      codeNameEn: body.codeNameEn as string | undefined,
      description: body.description as string | undefined,
      sortOrder: (body.sortOrder as number) || mockCommonCodes.filter(c => c.groupCode === group.groupCode).length + 1,
      active: true,
      status: 'ACTIVE',
      defaultCode: (body.defaultCode as boolean) ?? false,
      level: (body.level as number | undefined) as CommonCode['level'],
      parentCodeId: body.parentCodeId as string | undefined,
      effective: true,
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

  // Update code status
  http.patch('/api/v1/mdm/common-codes/:id/status', async ({ params, request }) => {
    await delay(300);

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

    const body = await request.json() as { status: CodeStatus; reason?: string };
    const previousStatus = code.status;

    // Update the code
    code.active = body.status === 'ACTIVE';
    code.status = body.status;
    codeStatusMap.set(id as string, body.status);

    // Add history entry
    const historyAction: CodeHistoryAction = body.status === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE';
    mockCodeHistory.push({
      id: `ch-${Date.now()}`,
      codeId: id as string,
      groupCode: code.groupCode,
      code: code.code,
      action: historyAction,
      fieldName: 'status',
      oldValue: previousStatus,
      newValue: body.status,
      changedBy: '현재 사용자',
      changedAt: new Date().toISOString(),
      changeReason: body.reason,
    });

    return HttpResponse.json({
      success: true,
      data: {
        id,
        previousStatus,
        newStatus: body.status,
        changedAt: new Date().toISOString(),
        changedBy: { id: 'user-001', name: '현재 사용자' },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Update code group status
  http.patch('/api/v1/mdm/code-groups/:id/status', async ({ params, request }) => {
    await delay(300);

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

    if (group.system) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_004', message: '시스템 코드그룹의 상태는 변경할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json() as { status: CodeStatus; reason?: string };
    const previousStatus = group.status;
    group.active = body.status === 'ACTIVE';
    group.status = body.status;

    return HttpResponse.json({
      success: true,
      data: {
        id,
        previousStatus,
        newStatus: body.status,
        changedAt: new Date().toISOString(),
        changedBy: { id: 'user-001', name: '현재 사용자' },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Check duplicate code
  http.post('/api/v1/mdm/common-codes/check-duplicate', async ({ request }) => {
    await delay(200);

    const body = await request.json() as { groupCode: string; code: string; name: string };
    const { groupCode, code, name } = body;

    // Check for exact code duplicate
    const exactCodeMatch = mockCommonCodes.find(
      c => c.groupCode === groupCode && c.code === code
    );
    if (exactCodeMatch) {
      return HttpResponse.json({
        success: true,
        data: {
          hasDuplicate: true,
          duplicateType: 'EXACT_CODE',
          duplicateMessage: `동일한 코드 '${code}'가 이미 존재합니다.`,
          similarCodes: [{ ...exactCodeMatch, similarity: 100 }],
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check for exact name duplicate
    const exactNameMatch = mockCommonCodes.find(
      c => c.groupCode === groupCode && c.codeName === name
    );
    if (exactNameMatch) {
      return HttpResponse.json({
        success: true,
        data: {
          hasDuplicate: true,
          duplicateType: 'EXACT_NAME',
          duplicateMessage: `동일한 이름 '${name}'이 이미 존재합니다.`,
          similarCodes: [{ ...exactNameMatch, similarity: 100 }],
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check for similar codes
    const similarCodes = mockCommonCodes
      .filter(c => c.groupCode === groupCode)
      .filter(c => {
        const codeSimilar = c.code.toLowerCase().includes(code.toLowerCase()) ||
                          code.toLowerCase().includes(c.code.toLowerCase());
        const nameSimilar = c.codeName.includes(name) || name.includes(c.codeName);
        return codeSimilar || nameSimilar;
      })
      .map(c => ({
        id: c.id,
        groupCode: c.groupCode,
        code: c.code,
        name: c.codeName,
        similarity: Math.floor(Math.random() * 30) + 50, // 50-80% similarity
      }));

    return HttpResponse.json({
      success: true,
      data: {
        hasDuplicate: false,
        similarCodes,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Bulk status change
  http.post('/api/v1/mdm/common-codes/bulk-status', async ({ request }) => {
    await delay(500);

    const body = await request.json() as { ids: string[]; status: string };
    const { ids, status } = body;

    let updatedCount = 0;

    ids.forEach(id => {
      const code = mockCommonCodes.find(c => c.id === id);
      if (code) {
        const previousStatus = code.status;
        code.active = status === 'ACTIVE';
        code.status = status as CodeStatus;
        codeStatusMap.set(id, status as CodeStatus);
        updatedCount++;

        // Add history entry for each code
        const historyAction: CodeHistoryAction = status === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE';
        mockCodeHistory.push({
          id: `ch-${Date.now()}-${id}`,
          codeId: id,
          groupCode: code.groupCode,
          code: code.code,
          action: historyAction,
          fieldName: 'status',
          oldValue: previousStatus,
          newValue: status,
          changedBy: '현재 사용자',
          changedAt: new Date().toISOString(),
          changeReason: '일괄 상태 변경',
        });
      }
    });

    return HttpResponse.json({
      success: true,
      message: `${updatedCount}개 코드의 상태가 변경되었습니다.`,
      data: { updatedCount },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get code impact analysis
  http.get('/api/v1/mdm/common-codes/:id/impact', async ({ params }) => {
    await delay(400);

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

    // Generate mock impact data
    const affectedEntities = [];
    let totalAffected = 0;

    // Simulate different impact based on code type
    if (code.groupCode === 'LEAVE_TYPE') {
      const leaveCount = Math.floor(Math.random() * 100) + 10;
      totalAffected += leaveCount;
      affectedEntities.push({
        entityType: '휴가신청',
        entityName: 'leave_requests',
        tableName: 'leave_requests',
        recordCount: leaveCount,
        sampleRecords: [
          { id: 'lr-001', displayValue: '홍길동 - 2024.01.15 ~ 2024.01.17' },
          { id: 'lr-002', displayValue: '김철수 - 2024.02.01 ~ 2024.02.02' },
        ],
      });
    }

    if (code.groupCode === 'EMPLOYMENT_STATUS') {
      const empCount = Math.floor(Math.random() * 50) + 5;
      totalAffected += empCount;
      affectedEntities.push({
        entityType: '직원정보',
        entityName: 'employees',
        tableName: 'employees',
        recordCount: empCount,
        sampleRecords: [
          { id: 'emp-001', displayValue: '홍길동 (EMP001)' },
          { id: 'emp-002', displayValue: '김철수 (EMP002)' },
        ],
      });
    }

    if (code.groupCode === 'APPROVAL_TYPE') {
      const approvalCount = Math.floor(Math.random() * 200) + 20;
      totalAffected += approvalCount;
      affectedEntities.push({
        entityType: '결재문서',
        entityName: 'approvals',
        tableName: 'approval_documents',
        recordCount: approvalCount,
        sampleRecords: [
          { id: 'ap-001', displayValue: '휴가신청서 - 홍길동' },
          { id: 'ap-002', displayValue: '경비청구서 - 김철수' },
        ],
      });
    }

    const canDelete = totalAffected === 0;

    return HttpResponse.json({
      success: true,
      data: {
        codeId: id,
        code: code.code,
        codeName: code.codeName,
        affectedEntities,
        totalAffectedRecords: totalAffected,
        canDelete,
        deleteBlockReason: canDelete ? undefined : `${totalAffected}개의 데이터에서 사용 중입니다.`,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get code history (returns plain array, not PageResponse)
  http.get('/api/v1/mdm/common-codes/:id/history', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const url = new URL(request.url);
    const action = url.searchParams.get('action') as CodeHistoryAction | null;

    let filtered = mockCodeHistory.filter(h => h.codeId === id);

    if (action) {
      filtered = filtered.filter(h => h.action === action);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    return HttpResponse.json({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  }),

  // Search codes
  http.get('/api/v1/mdm/common-codes/search', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const groupCode = url.searchParams.get('groupCode');
    const threshold = parseInt(url.searchParams.get('threshold') || '50', 10);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    let results: CodeSearchResult[] = [];

    mockCommonCodes.forEach(code => {
      if (!includeInactive && !code.active) return;
      if (groupCode && code.groupCode !== groupCode) return;

      const keywordLower = keyword.toLowerCase();
      const codeLower = code.code.toLowerCase();
      const nameLower = code.codeName.toLowerCase();

      let similarity = 0;
      let matchType: 'EXACT' | 'PARTIAL' | 'FUZZY' = 'FUZZY';

      if (codeLower === keywordLower || nameLower === keywordLower) {
        similarity = 100;
        matchType = 'EXACT';
      } else if (codeLower.includes(keywordLower) || nameLower.includes(keywordLower)) {
        similarity = 80;
        matchType = 'PARTIAL';
      } else if (keywordLower.includes(codeLower) || keywordLower.includes(nameLower)) {
        similarity = 60;
        matchType = 'FUZZY';
      }

      if (similarity >= threshold) {
        const group = mockCodeGroups.find(g => g.groupCode === code.groupCode);
        results.push({
          id: code.id,
          groupCode: code.groupCode,
          groupName: group?.groupName || code.groupCode,
          code: code.code,
          codeName: code.codeName,
          codeNameEn: code.codeNameEn,
          active: code.active,
          similarity,
          matchType,
        });
      }
    });

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return HttpResponse.json({
      success: true,
      data: results.slice(0, 20),
      timestamp: new Date().toISOString(),
    });
  }),

  // Get code tree (hierarchical)
  http.get('/api/v1/mdm/common-codes/tree', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const groupCode = url.searchParams.get('groupCode') || '';
    const codes = mockCommonCodes.filter(c => c.groupCode === groupCode);

    // Build tree structure using parentCodeId
    const buildTree = (parentId?: string, level = 0): CodeTreeNode[] => {
      return codes
        .filter(c => parentId ? c.parentCodeId === parentId : !c.parentCodeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(c => ({
          id: c.id,
          code: c.code,
          codeName: c.codeName,
          codeNameEn: c.codeNameEn,
          level,
          sortOrder: c.sortOrder,
          active: c.active,
          children: buildTree(c.id, level + 1),
        }));
    };

    // If no parent codes exist, return flat list as tree
    const hasHierarchy = codes.some(c => c.parentCodeId);
    const tree = hasHierarchy
      ? buildTree(undefined, 0)
      : codes.sort((a, b) => a.sortOrder - b.sortOrder).map(c => ({
          id: c.id,
          code: c.code,
          codeName: c.codeName,
          codeNameEn: c.codeNameEn,
          level: 0,
          sortOrder: c.sortOrder,
          active: c.active,
          children: [],
        }));

    return HttpResponse.json({
      success: true,
      data: tree,
      timestamp: new Date().toISOString(),
    });
  }),

  // Migration preview
  http.get('/api/v1/mdm/common-codes/migration/preview', async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const sourceCodeId = url.searchParams.get('sourceCodeId');
    const targetCodeId = url.searchParams.get('targetCodeId');

    const sourceCode = mockCommonCodes.find(c => c.id === sourceCodeId);
    const targetCode = mockCommonCodes.find(c => c.id === targetCodeId);

    if (!sourceCode || !targetCode) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_003', message: '코드를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const affectedTables = [];
    let totalRecords = 0;
    const warnings = [];

    if (sourceCode.groupCode === 'LEAVE_TYPE') {
      const count = Math.floor(Math.random() * 100) + 10;
      totalRecords += count;
      affectedTables.push({ tableName: 'leave_requests', columnName: 'leave_type', recordCount: count });
    }

    if (sourceCode.groupCode !== targetCode.groupCode) {
      warnings.push('원본 코드와 대상 코드의 그룹이 다릅니다. 마이그레이션 후 데이터 정합성을 확인하세요.');
    }

    return HttpResponse.json({
      success: true,
      data: {
        sourceCode: {
          id: sourceCode.id,
          code: sourceCode.code,
          name: sourceCode.codeName,
          groupCode: sourceCode.groupCode,
        },
        targetCode: {
          id: targetCode.id,
          code: targetCode.code,
          name: targetCode.codeName,
          groupCode: targetCode.groupCode,
        },
        affectedTables,
        totalAffectedRecords: totalRecords,
        estimatedDuration: `약 ${Math.ceil(totalRecords / 100)}초`,
        warnings,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Migrate code
  http.post('/api/v1/mdm/common-codes/migrate', async ({ request }) => {
    await delay(1000);

    const body = await request.json() as { sourceCodeId: string; targetCodeId: string; reason: string; deprecateSource?: boolean };
    const { sourceCodeId, targetCodeId, deprecateSource = true } = body;

    const sourceCode = mockCommonCodes.find(c => c.id === sourceCodeId);
    const targetCode = mockCommonCodes.find(c => c.id === targetCodeId);

    if (!sourceCode || !targetCode) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'MDM_003', message: '코드를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Deprecate source code if requested
    if (deprecateSource) {
      sourceCode.active = false;
      sourceCode.status = 'DEPRECATED';
      codeStatusMap.set(sourceCodeId, 'DEPRECATED');
    }

    const totalMigrated = Math.floor(Math.random() * 100) + 10;

    return HttpResponse.json({
      success: true,
      data: {
        migrationId: `mig-${Date.now()}`,
        sourceCode: sourceCode.code,
        targetCode: targetCode.code,
        totalMigrated,
        affectedTables: [
          { tableName: 'leave_requests', columnName: 'leave_type', recordCount: totalMigrated },
        ],
        completedAt: new Date().toISOString(),
        status: 'COMPLETED',
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get tenant codes (with enabled filter instead of isEnabled)
  http.get('/api/v1/mdm/tenant-codes', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const groupCode = url.searchParams.get('groupCode');
    const keyword = url.searchParams.get('keyword') || '';
    const enabled = url.searchParams.get('enabled');

    let filtered = [...mockTenantCodeSettings];

    if (groupCode) {
      filtered = filtered.filter(t => t.groupCode === groupCode);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(t =>
        t.code.toLowerCase().includes(lower) ||
        t.originalName.toLowerCase().includes(lower) ||
        (t.customName && t.customName.toLowerCase().includes(lower))
      );
    }

    if (enabled !== null && enabled !== '') {
      filtered = filtered.filter(t => t.enabled === (enabled === 'true'));
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page: {
          number: page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Update tenant code
  http.put('/api/v1/mdm/tenant-codes/:codeId', async ({ params, request }) => {
    await delay(300);

    const { codeId } = params;
    const setting = mockTenantCodeSettings.find(t => t.codeId === codeId);

    if (!setting) {
      // Create new setting if not exists
      const code = mockCommonCodes.find(c => c.id === codeId);
      if (!code) {
        return HttpResponse.json(
          {
            success: false,
            error: { code: 'MDM_003', message: '코드를 찾을 수 없습니다.' },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      const body = await request.json() as Record<string, unknown>;
      const newSetting: TenantCodeSetting = {
        id: `tcs-${Date.now()}`,
        codeId: codeId as string,
        groupCode: code.groupCode,
        code: code.code,
        originalName: code.codeName,
        customName: body.customName as string | undefined,
        customNameEn: body.customNameEn as string | undefined,
        enabled: body.enabled as boolean ?? true,
        sortOrder: body.sortOrder as number | undefined,
        tenantId: 'tenant-001',
        updatedAt: new Date().toISOString(),
      };
      mockTenantCodeSettings.push(newSetting);

      return HttpResponse.json({
        success: true,
        data: newSetting,
        timestamp: new Date().toISOString(),
      });
    }

    const body = await request.json() as Record<string, unknown>;
    Object.assign(setting, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return HttpResponse.json({
      success: true,
      data: setting,
      timestamp: new Date().toISOString(),
    });
  }),

  // Reset tenant code
  http.post('/api/v1/mdm/tenant-codes/:codeId/reset', async ({ params }) => {
    await delay(300);

    const { codeId } = params;
    const index = mockTenantCodeSettings.findIndex(t => t.codeId === codeId);

    if (index !== -1) {
      const setting = mockTenantCodeSettings[index];
      setting.customName = undefined;
      setting.customNameEn = undefined;
      setting.enabled = true;
      setting.sortOrder = undefined;
      setting.updatedAt = new Date().toISOString();

      return HttpResponse.json({
        success: true,
        data: setting,
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
