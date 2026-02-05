import { http, HttpResponse, delay } from 'msw';
import { format, subDays } from 'date-fns';
import type {
  Approval,
  ApprovalListItem,
  ApprovalStatus,
  ApprovalType,
  ApprovalStep,
  ApprovalStepStatus,
  ApprovalUrgency,
  ApprovalHistory,
  ApprovalTemplate,
  ApprovalActionType,
  DelegationRule,
  DelegationRuleListItem,
  DelegationRuleStatus,
  DelegationRuleConditionType,
} from '@hr-platform/shared-types';

const createApprovalStep = (
  order: number,
  name: string,
  status: ApprovalStepStatus,
  comment?: string,
  processedAt?: string
): ApprovalStep => ({
  id: `step-${Date.now()}-${order}`,
  stepOrder: order,
  approverType: 'SPECIFIC',
  approverId: `emp-00${order + 1}`,
  approverName: name,
  status,
  comment,
  processedAt,
});

// Mock delegations
interface MockDelegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegateeId: string;
  delegateeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

const mockDelegations: MockDelegation[] = [
  {
    id: 'del-001',
    delegatorId: 'emp-001',
    delegatorName: '홍길동',
    delegateeId: 'emp-002',
    delegateeName: '김철수',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 23), 'yyyy-MM-dd'),
    reason: '해외 출장',
    status: 'EXPIRED',
    createdAt: format(subDays(new Date(), 32), 'yyyy-MM-dd'),
  },
];

// Mock employee search results
const mockEmployeeSearchResults = [
  { id: 'emp-002', name: '김철수', departmentName: '개발팀' },
  { id: 'emp-003', name: '이영희', departmentName: '인사팀' },
  { id: 'emp-005', name: '최수진', departmentName: '마케팅팀' },
  { id: 'emp-006', name: '정민호', departmentName: '개발팀' },
  { id: 'emp-009', name: '임준혁', departmentName: '영업팀' },
];

// Mock approval history
const mockApprovalHistories: Record<string, ApprovalHistory[]> = {
  'appr-001': [
    {
      id: 'hist-001',
      approvalId: 'appr-001',
      stepOrder: 0,
      actionType: 'SUBMIT',
      actorId: 'emp-002',
      actorName: '김철수',
      actorDepartment: '개발팀',
      actorPosition: '사원',
      actionAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
  'appr-002': [
    {
      id: 'hist-002',
      approvalId: 'appr-002',
      stepOrder: 0,
      actionType: 'SUBMIT',
      actorId: 'emp-003',
      actorName: '이영희',
      actorDepartment: '인사팀',
      actorPosition: '대리',
      actionAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'hist-003',
      approvalId: 'appr-002',
      stepOrder: 1,
      actionType: 'APPROVE',
      actorId: 'emp-001',
      actorName: '홍길동',
      actorDepartment: '개발팀',
      actorPosition: '팀장',
      comment: '승인합니다.',
      actionAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
  'appr-004': [
    {
      id: 'hist-004',
      approvalId: 'appr-004',
      stepOrder: 0,
      actionType: 'SUBMIT',
      actorId: 'emp-005',
      actorName: '최수진',
      actorDepartment: '마케팅팀',
      actorPosition: '과장',
      actionAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'hist-005',
      approvalId: 'appr-004',
      stepOrder: 1,
      actionType: 'DELEGATE',
      actorId: 'emp-006',
      actorName: '정민호',
      actorDepartment: '개발팀',
      actorPosition: '대리',
      delegatorId: 'emp-001',
      delegatorName: '홍길동',
      comment: '출장으로 인한 대결',
      actionAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'hist-006',
      approvalId: 'appr-004',
      stepOrder: 1,
      actionType: 'APPROVE',
      actorId: 'emp-006',
      actorName: '정민호',
      actorDepartment: '개발팀',
      actorPosition: '대리',
      delegatorId: 'emp-001',
      delegatorName: '홍길동',
      comment: '승인',
      actionAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
};

// Mock approval templates
const mockApprovalTemplates: ApprovalTemplate[] = [
  {
    id: 'tpl-001',
    code: 'LEAVE_ANNUAL',
    name: '연차 휴가 신청서',
    description: '연차 휴가를 신청할 때 사용하는 양식입니다.',
    category: 'LEAVE_REQUEST',
    formSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', format: 'date', title: '시작일' },
        endDate: { type: 'string', format: 'date', title: '종료일' },
        reason: { type: 'string', title: '사유' },
      },
      required: ['startDate', 'endDate'],
    },
    defaultApprovalLine: [
      { stepOrder: 1, stepType: 'APPROVAL', approverType: 'DEPARTMENT_HEAD', isRequired: true },
      { stepOrder: 2, stepType: 'APPROVAL', approverType: 'ROLE', approverRole: 'HR_MANAGER', isRequired: true },
    ],
    retentionPeriod: 365,
    isActive: true,
    createdAt: format(subDays(new Date(), 100), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'tpl-002',
    code: 'EXPENSE_TRAVEL',
    name: '출장 경비 청구서',
    description: '출장 관련 경비를 청구할 때 사용하는 양식입니다.',
    category: 'EXPENSE',
    formSchema: {
      type: 'object',
      properties: {
        travelDate: { type: 'string', format: 'date', title: '출장일' },
        destination: { type: 'string', title: '출장지' },
        amount: { type: 'number', title: '청구 금액' },
        items: {
          type: 'array',
          title: '지출 항목',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', title: '항목' },
              amount: { type: 'number', title: '금액' },
            },
          },
        },
      },
      required: ['travelDate', 'destination', 'amount'],
    },
    defaultApprovalLine: [
      { stepOrder: 1, stepType: 'APPROVAL', approverType: 'DEPARTMENT_HEAD', isRequired: true },
    ],
    retentionPeriod: 365 * 5,
    isActive: true,
    createdAt: format(subDays(new Date(), 100), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'tpl-003',
    code: 'OVERTIME',
    name: '초과근무 신청서',
    description: '초과근무(야근, 휴일근무)를 신청할 때 사용하는 양식입니다.',
    category: 'OVERTIME',
    formSchema: {
      type: 'object',
      properties: {
        workDate: { type: 'string', format: 'date', title: '근무일' },
        startTime: { type: 'string', title: '시작 시간' },
        endTime: { type: 'string', title: '종료 시간' },
        reason: { type: 'string', title: '사유' },
      },
      required: ['workDate', 'startTime', 'endTime', 'reason'],
    },
    defaultApprovalLine: [
      { stepOrder: 1, stepType: 'APPROVAL', approverType: 'DEPARTMENT_HEAD', isRequired: true },
    ],
    retentionPeriod: 365,
    isActive: true,
    createdAt: format(subDays(new Date(), 90), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'tpl-004',
    code: 'GENERAL',
    name: '일반 기안서',
    description: '일반적인 업무 요청이나 보고에 사용하는 양식입니다.',
    category: 'GENERAL',
    formSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', title: '제목' },
        content: { type: 'string', title: '내용' },
      },
      required: ['subject', 'content'],
    },
    defaultApprovalLine: [],
    retentionPeriod: 365,
    isActive: true,
    createdAt: format(subDays(new Date(), 100), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
];

// ===== Mock Delegation Rules =====
const mockDelegationRules: DelegationRule[] = [
  {
    id: 'dlgrule-001',
    tenantId: 'tenant-001',
    name: '휴가신청 팀장 전결',
    description: '3일 이내 휴가신청은 팀장이 전결 처리',
    delegatorId: 'emp-001',
    delegatorName: '홍길동',
    delegatorDepartment: '개발팀',
    condition: {
      type: 'DOCUMENT_TYPE',
      documentTypes: ['LEAVE_REQUEST'],
    },
    target: {
      type: 'DEPARTMENT_HEAD',
    },
    priority: 1,
    status: 'ACTIVE',
    createdAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    createdBy: 'emp-001',
    createdByName: '홍길동',
    updatedAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'dlgrule-002',
    tenantId: 'tenant-001',
    name: '소액 경비 자동 전결',
    description: '10만원 이하 경비는 부서장 전결',
    delegatorId: 'emp-003',
    delegatorName: '이영희',
    delegatorDepartment: '인사팀',
    condition: {
      type: 'AMOUNT_RANGE',
      minAmount: 0,
      maxAmount: 100000,
    },
    target: {
      type: 'DEPARTMENT_HEAD',
    },
    priority: 2,
    status: 'ACTIVE',
    validFrom: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    validTo: format(subDays(new Date(), -30), 'yyyy-MM-dd'),
    createdAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    createdBy: 'emp-003',
    createdByName: '이영희',
    updatedAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'dlgrule-003',
    tenantId: 'tenant-001',
    name: '부재 시 대리자 위임',
    description: '3일 이상 부재 시 대리자에게 위임',
    delegatorId: 'emp-005',
    delegatorName: '최수진',
    delegatorDepartment: '마케팅팀',
    condition: {
      type: 'ABSENCE',
      absenceDays: 3,
    },
    target: {
      type: 'SPECIFIC',
      employeeId: 'emp-006',
      employeeName: '정민호',
    },
    priority: 3,
    status: 'INACTIVE',
    createdAt: format(subDays(new Date(), 20), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    createdBy: 'emp-005',
    createdByName: '최수진',
    updatedAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'dlgrule-004',
    tenantId: 'tenant-001',
    name: '일반문서 HR 담당자 위임',
    description: '모든 일반문서는 HR 담당자에게 위임',
    delegatorId: 'emp-009',
    delegatorName: '임준혁',
    delegatorDepartment: '영업팀',
    condition: {
      type: 'ALWAYS',
    },
    target: {
      type: 'ROLE',
      role: 'HR_MANAGER',
      roleName: 'HR 담당자',
    },
    priority: 10,
    status: 'ACTIVE',
    createdAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    createdBy: 'emp-009',
    createdByName: '임준혁',
    updatedAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
];

function toRuleListItem(rule: DelegationRule): DelegationRuleListItem {
  let conditionSummary = '';
  switch (rule.condition.type) {
    case 'DOCUMENT_TYPE':
      conditionSummary = rule.condition.documentTypes?.join(', ') || '';
      break;
    case 'AMOUNT_RANGE':
      conditionSummary = `${rule.condition.minAmount?.toLocaleString() || 0}원 ~ ${rule.condition.maxAmount?.toLocaleString() || '무제한'}원`;
      break;
    case 'ABSENCE':
      conditionSummary = `${rule.condition.absenceDays}일 이상 부재`;
      break;
    case 'ALWAYS':
      conditionSummary = '항상 적용';
      break;
  }

  let targetSummary = '';
  switch (rule.target.type) {
    case 'SPECIFIC':
      targetSummary = rule.target.employeeName || '';
      break;
    case 'ROLE':
      targetSummary = rule.target.roleName || rule.target.role || '';
      break;
    case 'DEPARTMENT_HEAD':
      targetSummary = '소속 부서장';
      break;
    case 'DEPUTY':
      targetSummary = '지정 대리자';
      break;
  }

  return {
    id: rule.id,
    name: rule.name,
    delegatorName: rule.delegatorName,
    delegatorDepartment: rule.delegatorDepartment,
    conditionType: rule.condition.type,
    conditionSummary,
    targetType: rule.target.type,
    targetSummary,
    priority: rule.priority,
    status: rule.status,
    validFrom: rule.validFrom,
    validTo: rule.validTo,
  };
}

const delegationRuleHandlers = [
  // Get delegation rules list
  http.get('/api/v1/approvals/delegations', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const status = url.searchParams.get('status') as DelegationRuleStatus | null;
    const conditionType = url.searchParams.get('conditionType') as DelegationRuleConditionType | null;

    let filtered = [...mockDelegationRules];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    if (conditionType) {
      filtered = filtered.filter(r => r.condition.type === conditionType);
    }

    filtered.sort((a, b) => a.priority - b.priority);

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toRuleListItem);

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

  // Get delegation rule detail
  http.get('/api/v1/approvals/delegations/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const rule = mockDelegationRules.find(r => r.id === id);

    if (!rule) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DLG_001', message: '위임전결 규칙을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create delegation rule
  http.post('/api/v1/approvals/delegations', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const delegator = mockEmployeeSearchResults.find(e => e.id === body.delegatorId);

    const newRule: DelegationRule = {
      id: `dlgrule-${Date.now()}`,
      tenantId: 'tenant-001',
      name: body.name as string,
      description: body.description as string | undefined,
      delegatorId: body.delegatorId as string,
      delegatorName: delegator?.name || '위임자',
      delegatorDepartment: delegator?.departmentName,
      condition: body.condition as DelegationRule['condition'],
      target: body.target as DelegationRule['target'],
      priority: (body.priority as number) || 10,
      status: 'ACTIVE',
      validFrom: body.validFrom as string | undefined,
      validTo: body.validTo as string | undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'emp-001',
      createdByName: '홍길동',
      updatedAt: new Date().toISOString(),
    };

    mockDelegationRules.push(newRule);

    return HttpResponse.json({
      success: true,
      data: newRule,
      message: '위임전결 규칙이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update delegation rule
  http.put('/api/v1/approvals/delegations/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockDelegationRules.findIndex(r => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DLG_001', message: '위임전결 규칙을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const rule = mockDelegationRules[index];

    if (body.name !== undefined) rule.name = body.name as string;
    if (body.description !== undefined) rule.description = body.description as string;
    if (body.condition !== undefined) rule.condition = body.condition as DelegationRule['condition'];
    if (body.target !== undefined) rule.target = body.target as DelegationRule['target'];
    if (body.priority !== undefined) rule.priority = body.priority as number;
    if (body.status !== undefined) rule.status = body.status as DelegationRuleStatus;
    if (body.validFrom !== undefined) rule.validFrom = body.validFrom as string;
    if (body.validTo !== undefined) rule.validTo = body.validTo as string;
    rule.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: rule,
      message: '위임전결 규칙이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete delegation rule
  http.delete('/api/v1/approvals/delegations/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockDelegationRules.findIndex(r => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DLG_001', message: '위임전결 규칙을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockDelegationRules.splice(index, 1);

    return HttpResponse.json({
      success: true,
      message: '위임전결 규칙이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Toggle delegation rule status
  http.post('/api/v1/approvals/delegations/:id/toggle-status', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockDelegationRules.findIndex(r => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DLG_001', message: '위임전결 규칙을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const rule = mockDelegationRules[index];
    rule.status = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    rule.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: rule,
      message: `규칙이 ${rule.status === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }),
];

const mockApprovals: Approval[] = [
  {
    id: 'appr-001',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0001',
    type: 'LEAVE_REQUEST',
    title: '연차 휴가 신청 (2024.02.15-16)',
    content: '개인 사유로 연차 휴가를 신청합니다.',
    requesterId: 'emp-002',
    requesterName: '김철수',
    requesterDepartment: '개발팀',
    status: 'PENDING',
    urgency: 'NORMAL',
    dueDate: format(subDays(new Date(), -3), 'yyyy-MM-dd'),
    steps: [
      createApprovalStep(1, '홍길동', 'PENDING'),
      createApprovalStep(2, '이영희', 'PENDING'),
    ],
    createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 2), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-002',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0002',
    type: 'EXPENSE',
    title: '출장 경비 청구 (서울 출장)',
    content: '서울 출장 관련 교통비 및 식비를 청구합니다.\n총 금액: 150,000원',
    requesterId: 'emp-003',
    requesterName: '이영희',
    requesterDepartment: '인사팀',
    status: 'APPROVED',
    urgency: 'NORMAL',
    completedAt: format(subDays(new Date(), 5), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    steps: [
      createApprovalStep(1, '홍길동', 'APPROVED', '승인합니다.', format(subDays(new Date(), 5), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')),
    ],
    createdAt: format(subDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 5), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-003',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0003',
    type: 'OVERTIME',
    title: '초과 근무 신청 (2024.01.20)',
    content: '프로젝트 마감으로 인한 초과 근무를 신청합니다.\n예상 초과 시간: 3시간',
    requesterId: 'emp-006',
    requesterName: '정민호',
    requesterDepartment: '개발팀',
    status: 'REJECTED',
    urgency: 'HIGH',
    steps: [
      createApprovalStep(1, '홍길동', 'REJECTED', '대체 일정으로 조정 바랍니다.', format(subDays(new Date(), 10), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')),
    ],
    createdAt: format(subDays(new Date(), 12), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 10), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-004',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0004',
    type: 'GENERAL',
    title: '업무 협조 요청 (마케팅 자료 제작)',
    content: '신규 서비스 출시를 위한 마케팅 자료 제작을 요청합니다.',
    requesterId: 'emp-005',
    requesterName: '최수진',
    requesterDepartment: '마케팅팀',
    status: 'PENDING',
    urgency: 'HIGH',
    dueDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'),
    steps: [
      createApprovalStep(1, '홍길동', 'APPROVED', '승인', format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')),
      createApprovalStep(2, '임준혁', 'PENDING'),
    ],
    createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-005',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0005',
    type: 'PERSONNEL',
    title: '직원 인사 발령 (개발팀 → QA팀)',
    content: '한예진 사원의 부서 이동을 요청합니다.\n이동 부서: QA팀\n발령일: 2024.03.01',
    requesterId: 'emp-001',
    requesterName: '홍길동',
    requesterDepartment: '개발팀',
    status: 'DRAFT',
    urgency: 'NORMAL',
    steps: [],
    createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-006',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0006',
    type: 'LEAVE_REQUEST',
    title: '병가 신청 (2024.01.08)',
    content: '감기로 인한 병가를 신청합니다.',
    requesterId: 'emp-007',
    requesterName: '강하늘',
    requesterDepartment: '디자인팀',
    status: 'APPROVED',
    urgency: 'NORMAL',
    completedAt: format(subDays(new Date(), 25), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    steps: [
      createApprovalStep(1, '최수진', 'APPROVED', '빠른 쾌유를 바랍니다.', format(subDays(new Date(), 25), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')),
    ],
    createdAt: format(subDays(new Date(), 26), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 25), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
  {
    id: 'appr-007',
    tenantId: 'tenant-001',
    documentNumber: 'APR-2024-0007',
    type: 'EXPENSE',
    title: '교육비 청구 (AWS 자격증)',
    content: 'AWS Solutions Architect 자격증 시험 응시료를 청구합니다.\n금액: 300,000원',
    requesterId: 'emp-010',
    requesterName: '한예진',
    requesterDepartment: '개발팀',
    status: 'PENDING',
    urgency: 'LOW',
    steps: [
      createApprovalStep(1, '홍길동', 'PENDING'),
      createApprovalStep(2, '이영희', 'PENDING'),
    ],
    createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
  },
];

function toListItem(approval: Approval): ApprovalListItem {
  const currentStep = approval.steps.find(s => s.status === 'PENDING');
  return {
    id: approval.id,
    documentNumber: approval.documentNumber,
    type: approval.type,
    title: approval.title,
    requesterName: approval.requesterName,
    requesterDepartment: approval.requesterDepartment,
    status: approval.status,
    urgency: approval.urgency,
    createdAt: approval.createdAt,
    dueDate: approval.dueDate,
    currentStepName: currentStep?.approverName,
  };
}

export const approvalHandlers = [
  // Get approvals list
  http.get('/api/v1/approvals', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const type = url.searchParams.get('type') as ApprovalType | null;
    const status = url.searchParams.get('status') as ApprovalStatus | null;
    const tab = url.searchParams.get('tab');

    let filtered = [...mockApprovals];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(lower) ||
             a.documentNumber.toLowerCase().includes(lower) ||
             a.requesterName.toLowerCase().includes(lower)
      );
    }

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    // Tab filtering
    if (tab === 'pending') {
      // Approvals waiting for current user's action
      filtered = filtered.filter(a => a.status === 'PENDING');
    } else if (tab === 'requested') {
      // Approvals I created (mock: emp-001)
      filtered = filtered.filter(a => a.requesterId === 'emp-001' || a.requesterId === 'emp-002');
    } else if (tab === 'completed') {
      filtered = filtered.filter(a => ['APPROVED', 'REJECTED'].includes(a.status));
    } else if (tab === 'draft') {
      filtered = filtered.filter(a => a.status === 'DRAFT');
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

  // Get approval summary (counts)
  http.get('/api/v1/approvals/summary', async () => {
    await delay(200);

    const pending = mockApprovals.filter(a => a.status === 'PENDING').length;
    const approved = mockApprovals.filter(a => a.status === 'APPROVED').length;
    const rejected = mockApprovals.filter(a => a.status === 'REJECTED').length;
    const draft = mockApprovals.filter(a => a.status === 'DRAFT').length;

    return HttpResponse.json({
      success: true,
      data: { pending, approved, rejected, draft },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get approval detail
  http.get('/api/v1/approvals/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const approval = mockApprovals.find(a => a.id === id);

    if (!approval) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: approval,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create approval
  http.post('/api/v1/approvals', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const approverIds = body.approverIds as string[];

    const newApproval: Approval = {
      id: `appr-${Date.now()}`,
      tenantId: 'tenant-001',
      documentNumber: `APR-2024-${String(mockApprovals.length + 1).padStart(4, '0')}`,
      type: body.type as ApprovalType,
      title: body.title as string,
      content: body.content as string,
      requesterId: 'emp-001',
      requesterName: '홍길동',
      requesterDepartment: '개발팀',
      status: 'PENDING',
      urgency: (body.urgency as ApprovalUrgency) || 'NORMAL',
      dueDate: body.dueDate as string | undefined,
      steps: approverIds.map((id, index) => ({
        id: `step-${Date.now()}-${index}`,
        stepOrder: index + 1,
        approverType: 'SPECIFIC' as const,
        approverId: id,
        approverName: ['홍길동', '이영희', '임준혁'][index] || '결재자',
        status: 'PENDING' as ApprovalStepStatus,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApprovals.unshift(newApproval);

    return HttpResponse.json({
      success: true,
      data: newApproval,
      message: '결재가 요청되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Approve
  http.post('/api/v1/approvals/:id/approve', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const approval = mockApprovals[index];

    // Find current pending step
    const pendingStep = approval.steps.find(s => s.status === 'PENDING');
    if (pendingStep) {
      pendingStep.status = 'APPROVED';
      pendingStep.comment = body.comment as string | undefined;
      pendingStep.processedAt = new Date().toISOString();
    }

    // Check if all steps are approved
    const allApproved = approval.steps.every(s => s.status === 'APPROVED');
    if (allApproved) {
      approval.status = 'APPROVED';
      approval.completedAt = new Date().toISOString();
    }

    approval.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '승인되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Reject
  http.post('/api/v1/approvals/:id/reject', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const approval = mockApprovals[index];

    // Find current pending step
    const pendingStep = approval.steps.find(s => s.status === 'PENDING');
    if (pendingStep) {
      pendingStep.status = 'REJECTED';
      pendingStep.comment = body.comment as string;
      pendingStep.processedAt = new Date().toISOString();
    }

    approval.status = 'REJECTED';
    approval.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '반려되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Cancel
  http.post('/api/v1/approvals/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const approval = mockApprovals[index];
    if (!['DRAFT', 'PENDING'].includes(approval.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_002', message: '취소할 수 없는 상태입니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    approval.status = 'CANCELLED';
    approval.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get delegations
  http.get('/api/v1/approvals/delegations', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: mockDelegations,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create delegation
  http.post('/api/v1/approvals/delegations', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const delegatee = mockEmployeeSearchResults.find(e => e.id === body.delegateeId);

    const newDelegation: MockDelegation = {
      id: `del-${Date.now()}`,
      delegatorId: 'emp-001',
      delegatorName: '홍길동',
      delegateeId: body.delegateeId as string,
      delegateeName: delegatee?.name || '위임자',
      startDate: body.startDate as string,
      endDate: body.endDate as string,
      reason: body.reason as string,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    mockDelegations.unshift(newDelegation);

    return HttpResponse.json({
      success: true,
      data: newDelegation,
      message: '결재 위임이 설정되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Cancel delegation
  http.post('/api/v1/approvals/delegations/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockDelegations.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DEL_001', message: '위임 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockDelegations[index].status = 'CANCELLED';

    return HttpResponse.json({
      success: true,
      data: mockDelegations[index],
      message: '위임이 취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Employee search
  http.get('/api/v1/employees/search', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';

    let results = [...mockEmployeeSearchResults];
    if (keyword) {
      const lower = keyword.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(lower) ||
        e.departmentName.toLowerCase().includes(lower)
      );
    }

    return HttpResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 4.4 회수
  http.post('/api/v1/approvals/:id/recall', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const approval = mockApprovals[index];
    if (approval.status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_003', message: '회수할 수 없는 상태입니다. PENDING 상태에서만 회수 가능합니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    approval.status = 'RECALLED';
    approval.recalledAt = new Date().toISOString();
    approval.recallReason = body.reason as string;
    approval.updatedAt = new Date().toISOString();

    // Add history
    const historyList = mockApprovalHistories[id as string] || [];
    historyList.push({
      id: `hist-${Date.now()}`,
      approvalId: id as string,
      stepOrder: 0,
      actionType: 'RECALL',
      actorId: approval.requesterId,
      actorName: approval.requesterName,
      actorDepartment: approval.requesterDepartment,
      comment: body.reason as string,
      actionAt: new Date().toISOString(),
    });
    mockApprovalHistories[id as string] = historyList;

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '결재가 회수되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 4.5 결재 이력 조회
  http.get('/api/v1/approvals/:id/history', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const approval = mockApprovals.find(a => a.id === id);

    if (!approval) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Get stored history or generate from steps
    let history = mockApprovalHistories[id as string];

    if (!history || history.length === 0) {
      // Generate history from approval data
      history = [
        {
          id: `hist-auto-${Date.now()}-0`,
          approvalId: id as string,
          stepOrder: 0,
          actionType: 'SUBMIT' as ApprovalActionType,
          actorId: approval.requesterId,
          actorName: approval.requesterName,
          actorDepartment: approval.requesterDepartment,
          actionAt: approval.createdAt,
        },
      ];

      // Add step histories
      approval.steps.filter(s => s.processedAt).forEach((step, idx) => {
        history!.push({
          id: `hist-auto-${Date.now()}-${idx + 1}`,
          approvalId: id as string,
          stepOrder: step.stepOrder,
          actionType: step.status === 'APPROVED' ? 'APPROVE' : step.status === 'REJECTED' ? 'REJECT' : 'APPROVE',
          actorId: step.approverId || '',
          actorName: step.approverName || '',
          actorDepartment: step.approverDepartment,
          actorPosition: step.approverPosition,
          comment: step.comment,
          actionAt: step.processedAt!,
        });
      });
    }

    return HttpResponse.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 4.6 대결
  http.post('/api/v1/approvals/:id/steps/:stepId/delegate', async ({ params, request }) => {
    await delay(300);

    const { id, stepId } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const approval = mockApprovals[index];
    const step = approval.steps.find(s => s.id === stepId);

    if (!step) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_004', message: '결재 단계를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (step.status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_005', message: '대결을 지정할 수 없는 단계입니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const delegatee = mockEmployeeSearchResults.find(e => e.id === body.delegateToId);

    // Update step with delegation info
    step.delegatorId = step.approverId;
    step.delegatorName = step.approverName;
    step.approverId = body.delegateToId as string;
    step.approverName = delegatee?.name || (body.delegateToName as string) || '대결자';
    step.delegatedAt = new Date().toISOString();

    approval.updatedAt = new Date().toISOString();

    // Add history
    const historyList = mockApprovalHistories[id as string] || [];
    historyList.push({
      id: `hist-${Date.now()}`,
      approvalId: id as string,
      stepOrder: step.stepOrder,
      actionType: 'DELEGATE',
      actorId: body.delegateToId as string,
      actorName: delegatee?.name || (body.delegateToName as string) || '대결자',
      actorDepartment: delegatee?.departmentName,
      delegatorId: step.delegatorId,
      delegatorName: step.delegatorName,
      comment: body.reason as string,
      actionAt: new Date().toISOString(),
    });
    mockApprovalHistories[id as string] = historyList;

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '대결자가 지정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 4.7 전결
  http.post('/api/v1/approvals/:id/direct-approve', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovals.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_001', message: '결재 문서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const approval = mockApprovals[index];
    if (approval.status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APR_006', message: '전결 처리할 수 없는 상태입니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const skipToStep = body.skipToStep as number | undefined;
    const maxStepOrder = skipToStep || Math.max(...approval.steps.map(s => s.stepOrder));

    // Approve all pending steps up to skipToStep
    approval.steps.forEach(step => {
      if (step.status === 'PENDING' && step.stepOrder <= maxStepOrder) {
        step.status = 'APPROVED';
        step.directApproved = true;
        step.comment = `전결 처리: ${body.reason}`;
        step.processedAt = new Date().toISOString();
      }
    });

    // Check if all steps are approved
    const allApproved = approval.steps.every(s => s.status === 'APPROVED' || s.status === 'SKIPPED');
    if (allApproved) {
      approval.status = 'APPROVED';
      approval.completedAt = new Date().toISOString();
    }

    approval.directApprovedBy = 'emp-001'; // Mock current user
    approval.directApprovedAt = new Date().toISOString();
    approval.updatedAt = new Date().toISOString();

    // Add history
    const historyList = mockApprovalHistories[id as string] || [];
    historyList.push({
      id: `hist-${Date.now()}`,
      approvalId: id as string,
      stepOrder: maxStepOrder,
      actionType: 'DIRECT_APPROVE',
      actorId: 'emp-001',
      actorName: '홍길동',
      actorDepartment: '개발팀',
      actorPosition: '팀장',
      comment: body.reason as string,
      actionAt: new Date().toISOString(),
    });
    mockApprovalHistories[id as string] = historyList;

    return HttpResponse.json({
      success: true,
      data: approval,
      message: '전결 처리되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 3.3.4 결재 양식 목록
  http.get('/api/v1/approvals/templates', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('isActive');

    let templates = [...mockApprovalTemplates];

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (isActive !== null) {
      const activeFlag = isActive === 'true';
      templates = templates.filter(t => t.isActive === activeFlag);
    }

    return HttpResponse.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    });
  }),

  // SDD 3.3.4 결재 양식 상세
  http.get('/api/v1/approvals/templates/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const template = mockApprovalTemplates.find(t => t.id === id);

    if (!template) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TPL_001', message: '결재 양식을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  }),

  // 결재 양식 생성
  http.post('/api/v1/approvals/templates', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newTemplate: ApprovalTemplate = {
      id: `tpl-${Date.now()}`,
      code: body.code as string,
      name: body.name as string,
      description: body.description as string | undefined,
      category: body.category as string,
      formSchema: {},
      defaultApprovalLine: body.defaultApprovalLine as ApprovalTemplate['defaultApprovalLine'],
      retentionPeriod: body.retentionPeriod as number | undefined,
      isActive: body.isActive as boolean ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApprovalTemplates.unshift(newTemplate);

    return HttpResponse.json({
      success: true,
      data: newTemplate,
      message: '양식이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // 결재 양식 수정
  http.put('/api/v1/approvals/templates/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovalTemplates.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TPL_001', message: '결재 양식을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const template = mockApprovalTemplates[index];

    if (body.name !== undefined) template.name = body.name as string;
    if (body.description !== undefined) template.description = body.description as string;
    if (body.category !== undefined) template.category = body.category as string;
    if (body.defaultApprovalLine !== undefined) template.defaultApprovalLine = body.defaultApprovalLine as ApprovalTemplate['defaultApprovalLine'];
    if (body.retentionPeriod !== undefined) template.retentionPeriod = body.retentionPeriod as number;
    if (body.isActive !== undefined) template.isActive = body.isActive as boolean;
    template.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: template,
      message: '양식이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 결재 양식 삭제
  http.delete('/api/v1/approvals/templates/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockApprovalTemplates.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TPL_001', message: '결재 양식을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockApprovalTemplates.splice(index, 1);

    return HttpResponse.json({
      success: true,
      message: '양식이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // ===== 위임전결 규칙 핸들러 =====
  ...delegationRuleHandlers,
];
