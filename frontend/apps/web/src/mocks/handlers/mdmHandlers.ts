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
    action: 'CREATED',
    changedBy: { id: 'user-001', name: '관리자' },
    changedAt: '2024-01-01T09:00:00Z',
  },
  {
    id: 'ch-002',
    codeId: 'cc-001',
    action: 'UPDATED',
    changedField: 'name',
    oldValue: '연차휴가',
    newValue: '연차',
    changedBy: { id: 'user-001', name: '관리자' },
    changedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'ch-003',
    codeId: 'cc-001',
    action: 'STATUS_CHANGED',
    changedField: 'status',
    oldValue: 'INACTIVE',
    newValue: 'ACTIVE',
    changedBy: { id: 'user-002', name: '김인사' },
    changedAt: '2024-02-01T10:00:00Z',
    reason: '휴가 시즌 시작으로 활성화',
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
    isEnabled: true,
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
    isEnabled: true,
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
    isEnabled: false,
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
  // Leave Types - with 4-level classification hierarchy
  // Level 1 (대분류): 휴가
  { id: 'cc-001', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'ANNUAL', name: '연차', nameEn: 'Annual Leave', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '연차', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-002', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'SICK', name: '병가', nameEn: 'Sick Leave', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '병가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-003', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'SPECIAL', name: '특별휴가', nameEn: 'Special Leave', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '특별휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 연차 하위
  { id: 'cc-004', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_AM', name: '반차(오전)', nameEn: 'Half Day (AM)', sortOrder: 4, isActive: true, classificationLevel: 2, parentCodeId: 'cc-001', classificationPath: '연차 > 반차(오전)', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-005', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'HALF_DAY_PM', name: '반차(오후)', nameEn: 'Half Day (PM)', sortOrder: 5, isActive: true, classificationLevel: 2, parentCodeId: 'cc-001', classificationPath: '연차 > 반차(오후)', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 특별휴가 하위
  { id: 'cc-006', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY', name: '출산휴가', nameEn: 'Maternity Leave', sortOrder: 6, isActive: true, classificationLevel: 2, parentCodeId: 'cc-003', classificationPath: '특별휴가 > 출산휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-007', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'PATERNITY', name: '배우자출산휴가', nameEn: 'Paternity Leave', sortOrder: 7, isActive: true, classificationLevel: 2, parentCodeId: 'cc-003', classificationPath: '특별휴가 > 배우자출산휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 3 (소분류): 출산휴가 하위
  { id: 'cc-006-1', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_PRE', name: '출산전 휴가', nameEn: 'Pre-Maternity Leave', sortOrder: 61, isActive: true, classificationLevel: 3, parentCodeId: 'cc-006', classificationPath: '특별휴가 > 출산휴가 > 출산전 휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-006-2', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_POST', name: '출산후 휴가', nameEn: 'Post-Maternity Leave', sortOrder: 62, isActive: true, classificationLevel: 3, parentCodeId: 'cc-006', classificationPath: '특별휴가 > 출산휴가 > 출산후 휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 4 (세분류): 출산전 휴가 하위
  { id: 'cc-006-1-1', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'MATERNITY_PRE_PAID', name: '유급 출산전 휴가', nameEn: 'Paid Pre-Maternity', sortOrder: 611, isActive: true, classificationLevel: 4, parentCodeId: 'cc-006-1', classificationPath: '특별휴가 > 출산휴가 > 출산전 휴가 > 유급 출산전 휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-008', tenantId: 'tenant-001', groupId: 'cg-001', groupCode: 'LEAVE_TYPE', code: 'UNPAID', name: '무급휴가', nameEn: 'Unpaid Leave', sortOrder: 8, isActive: true, classificationLevel: 1, classificationPath: '무급휴가', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Employment Status (flat - level 1 only)
  { id: 'cc-011', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'ACTIVE', name: '재직', nameEn: 'Active', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '재직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-012', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'ON_LEAVE', name: '휴직', nameEn: 'On Leave', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '휴직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-013', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'RESIGNED', name: '퇴직', nameEn: 'Resigned', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '퇴직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-014', tenantId: 'tenant-001', groupId: 'cg-002', groupCode: 'EMPLOYMENT_STATUS', code: 'RETIRED', name: '정년퇴직', nameEn: 'Retired', sortOrder: 4, isActive: true, classificationLevel: 1, classificationPath: '정년퇴직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Gender (flat - level 1 only)
  { id: 'cc-021', tenantId: 'tenant-001', groupId: 'cg-003', groupCode: 'GENDER', code: 'MALE', name: '남성', nameEn: 'Male', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '남성', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-022', tenantId: 'tenant-001', groupId: 'cg-003', groupCode: 'GENDER', code: 'FEMALE', name: '여성', nameEn: 'Female', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '여성', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Approval Types - with hierarchy
  // Level 1 (대분류)
  { id: 'cc-031', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'LEAVE_REQUEST', name: '휴가신청', nameEn: 'Leave Request', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '휴가신청', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-032', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE', name: '경비청구', nameEn: 'Expense', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '경비청구', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-033', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'OVERTIME', name: '초과근무신청', nameEn: 'Overtime', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '초과근무신청', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-034', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'PERSONNEL', name: '인사관련', nameEn: 'Personnel', sortOrder: 4, isActive: true, classificationLevel: 1, classificationPath: '인사관련', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-035', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'GENERAL', name: '일반기안', nameEn: 'General', sortOrder: 5, isActive: true, classificationLevel: 1, classificationPath: '일반기안', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Level 2 (중분류): 경비청구 하위
  { id: 'cc-032-1', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE_TRAVEL', name: '출장경비', nameEn: 'Travel Expense', sortOrder: 21, isActive: true, classificationLevel: 2, parentCodeId: 'cc-032', classificationPath: '경비청구 > 출장경비', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-032-2', tenantId: 'tenant-001', groupId: 'cg-004', groupCode: 'APPROVAL_TYPE', code: 'EXPENSE_SUPPLY', name: '비품구매', nameEn: 'Supply Expense', sortOrder: 22, isActive: true, classificationLevel: 2, parentCodeId: 'cc-032', classificationPath: '경비청구 > 비품구매', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Positions (flat)
  { id: 'cc-041', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'TEAM_LEADER', name: '팀장', nameEn: 'Team Leader', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '팀장', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-042', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'SENIOR', name: '선임', nameEn: 'Senior', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '선임', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-043', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'MANAGER', name: '매니저', nameEn: 'Manager', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '매니저', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-044', tenantId: 'tenant-001', groupId: 'cg-005', groupCode: 'POSITION', code: 'STAFF', name: '사원', nameEn: 'Staff', sortOrder: 4, isActive: true, classificationLevel: 1, classificationPath: '사원', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Grades (flat)
  { id: 'cc-051', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G1', name: '부장', nameEn: 'Director', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '부장', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-052', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G2', name: '차장', nameEn: 'Deputy Director', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '차장', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-053', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G3', name: '과장', nameEn: 'Manager', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '과장', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-054', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G4', name: '대리', nameEn: 'Assistant Manager', sortOrder: 4, isActive: true, classificationLevel: 1, classificationPath: '대리', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-055', tenantId: 'tenant-001', groupId: 'cg-006', groupCode: 'GRADE', code: 'G5', name: '사원', nameEn: 'Staff', sortOrder: 5, isActive: true, classificationLevel: 1, classificationPath: '사원', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },

  // Contract Types (flat)
  { id: 'cc-061', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'PERMANENT', name: '정규직', nameEn: 'Permanent', sortOrder: 1, isActive: true, classificationLevel: 1, classificationPath: '정규직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-062', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'CONTRACT', name: '계약직', nameEn: 'Contract', sortOrder: 2, isActive: true, classificationLevel: 1, classificationPath: '계약직', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-063', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'INTERN', name: '인턴', nameEn: 'Intern', sortOrder: 3, isActive: true, classificationLevel: 1, classificationPath: '인턴', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cc-064', tenantId: 'tenant-001', groupId: 'cg-007', groupCode: 'CONTRACT_TYPE', code: 'PART_TIME', name: '파트타임', nameEn: 'Part-time', sortOrder: 4, isActive: true, classificationLevel: 1, classificationPath: '파트타임', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
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
    classificationLevel: code.classificationLevel,
    parentCodeId: code.parentCodeId,
    classificationPath: code.classificationPath,
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
    const classificationLevel = url.searchParams.get('classificationLevel');

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

    if (classificationLevel !== null && classificationLevel !== '') {
      const level = parseInt(classificationLevel, 10);
      filtered = filtered.filter(c => c.classificationLevel === level);
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
  http.get('/api/v1/mdm/common-codes/group/:groupCode', async ({ params }) => {
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

    // Build classification path
    let classificationPath = body.name as string;
    const parentCodeId = body.parentCodeId as string | undefined;
    if (parentCodeId) {
      const parentCode = mockCommonCodes.find(c => c.id === parentCodeId);
      if (parentCode?.classificationPath) {
        classificationPath = `${parentCode.classificationPath} > ${body.name as string}`;
      }
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
      classificationLevel: (body.classificationLevel as number | undefined) as CommonCode['classificationLevel'],
      parentCodeId: parentCodeId,
      classificationPath,
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
    const previousStatus = code.isActive ? 'ACTIVE' : 'INACTIVE';

    // Update the code
    code.isActive = body.status === 'ACTIVE';
    codeStatusMap.set(id as string, body.status);

    // Add history entry
    mockCodeHistory.push({
      id: `ch-${Date.now()}`,
      codeId: id as string,
      action: 'STATUS_CHANGED',
      changedField: 'status',
      oldValue: previousStatus,
      newValue: body.status,
      changedBy: { id: 'user-001', name: '현재 사용자' },
      changedAt: new Date().toISOString(),
      reason: body.reason,
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

    if (group.isSystem) {
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
    const previousStatus = group.isActive ? 'ACTIVE' : 'INACTIVE';
    group.isActive = body.status === 'ACTIVE';

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
      c => c.groupCode === groupCode && c.name === name
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
        const nameSimilar = c.name.includes(name) || name.includes(c.name);
        return codeSimilar || nameSimilar;
      })
      .map(c => ({
        id: c.id,
        groupCode: c.groupCode,
        code: c.code,
        name: c.name,
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
        const previousStatus = code.isActive ? 'ACTIVE' : 'INACTIVE';
        code.isActive = status === 'ACTIVE';
        codeStatusMap.set(id, status as CodeStatus);
        updatedCount++;

        // Add history entry for each code
        mockCodeHistory.push({
          id: `ch-${Date.now()}-${id}`,
          codeId: id,
          action: 'STATUS_CHANGED',
          changedField: 'status',
          oldValue: previousStatus,
          newValue: status,
          changedBy: { id: 'user-001', name: '현재 사용자' },
          changedAt: new Date().toISOString(),
          reason: '일괄 상태 변경',
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
        codeName: code.name,
        affectedEntities,
        totalAffectedRecords: totalAffected,
        canDelete,
        deleteBlockReason: canDelete ? undefined : `${totalAffected}개의 데이터에서 사용 중입니다.`,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get code history
  http.get('/api/v1/mdm/common-codes/:id/history', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const action = url.searchParams.get('action') as CodeHistoryAction | null;

    let filtered = mockCodeHistory.filter(h => h.codeId === id);

    if (action) {
      filtered = filtered.filter(h => h.action === action);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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
      if (!includeInactive && !code.isActive) return;
      if (groupCode && code.groupCode !== groupCode) return;

      const keywordLower = keyword.toLowerCase();
      const codeLower = code.code.toLowerCase();
      const nameLower = code.name.toLowerCase();

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
        const group = mockCodeGroups.find(g => g.code === code.groupCode);
        results.push({
          id: code.id,
          groupCode: code.groupCode,
          groupName: group?.name || code.groupCode,
          code: code.code,
          name: code.name,
          nameEn: code.nameEn,
          isActive: code.isActive,
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

    // Build tree structure
    const buildTree = (parentCode?: string, level = 0): CodeTreeNode[] => {
      return codes
        .filter(c => c.parentCode === parentCode)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          nameEn: c.nameEn,
          level,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          children: buildTree(c.code, level + 1),
        }));
    };

    // If no parent codes exist, return flat list as tree
    const hasHierarchy = codes.some(c => c.parentCode);
    const tree = hasHierarchy
      ? buildTree(undefined, 0)
      : codes.sort((a, b) => a.sortOrder - b.sortOrder).map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          nameEn: c.nameEn,
          level: 0,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
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
          name: sourceCode.name,
          groupCode: sourceCode.groupCode,
        },
        targetCode: {
          id: targetCode.id,
          code: targetCode.code,
          name: targetCode.name,
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
      sourceCode.isActive = false;
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

  // Get tenant codes
  http.get('/api/v1/mdm/tenant-codes', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const groupCode = url.searchParams.get('groupCode');
    const keyword = url.searchParams.get('keyword') || '';
    const isEnabled = url.searchParams.get('isEnabled');

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

    if (isEnabled !== null && isEnabled !== '') {
      filtered = filtered.filter(t => t.isEnabled === (isEnabled === 'true'));
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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
        originalName: code.name,
        customName: body.customName as string | undefined,
        customNameEn: body.customNameEn as string | undefined,
        isEnabled: body.isEnabled as boolean ?? true,
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
      setting.isEnabled = true;
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
