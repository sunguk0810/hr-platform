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
];
