import { http, HttpResponse, delay } from 'msw';
import type {
  TransferRequest,
  TransferRequestListItem,
  TransferStatus,
  TransferType,
  TransferSummary,
  HandoverItem,
} from '@hr-platform/shared-types';

// Mock tenants for transfer
const mockTenants = [
  { id: 'tenant-1', name: 'HR그룹 본사', code: 'HRHQ' },
  { id: 'tenant-2', name: 'HR그룹 전자', code: 'HREL' },
  { id: 'tenant-3', name: 'HR그룹 물산', code: 'HRTR' },
  { id: 'tenant-4', name: 'HR그룹 건설', code: 'HRCS' },
];

const mockDepartments: Record<string, Array<{ id: string; name: string; code: string }>> = {
  'tenant-1': [
    { id: 'dept-hq-1', name: '경영지원본부', code: 'HQ-MGMT' },
    { id: 'dept-hq-2', name: '인사팀', code: 'HQ-HR' },
    { id: 'dept-hq-3', name: '재무팀', code: 'HQ-FIN' },
  ],
  'tenant-2': [
    { id: 'dept-el-1', name: '연구개발본부', code: 'EL-RND' },
    { id: 'dept-el-2', name: '제조팀', code: 'EL-MFG' },
    { id: 'dept-el-3', name: '영업팀', code: 'EL-SALES' },
  ],
  'tenant-3': [
    { id: 'dept-tr-1', name: '무역사업부', code: 'TR-TRADE' },
    { id: 'dept-tr-2', name: '물류팀', code: 'TR-LOG' },
  ],
  'tenant-4': [
    { id: 'dept-cs-1', name: '건축사업부', code: 'CS-ARCH' },
    { id: 'dept-cs-2', name: '토목사업부', code: 'CS-CIVIL' },
  ],
};

const mockPositions: Record<string, Array<{ id: string; name: string }>> = {
  'tenant-1': [
    { id: 'pos-1', name: '본부장' },
    { id: 'pos-2', name: '팀장' },
    { id: 'pos-3', name: '파트장' },
  ],
  'tenant-2': [
    { id: 'pos-1', name: '센터장' },
    { id: 'pos-2', name: '팀장' },
    { id: 'pos-3', name: '파트장' },
  ],
  'tenant-3': [
    { id: 'pos-1', name: '사업부장' },
    { id: 'pos-2', name: '팀장' },
  ],
  'tenant-4': [
    { id: 'pos-1', name: '사업부장' },
    { id: 'pos-2', name: '팀장' },
    { id: 'pos-3', name: '현장소장' },
  ],
};

const mockGrades: Record<string, Array<{ id: string; name: string }>> = {
  'tenant-1': [
    { id: 'grade-1', name: '임원' },
    { id: 'grade-2', name: '부장' },
    { id: 'grade-3', name: '차장' },
    { id: 'grade-4', name: '과장' },
    { id: 'grade-5', name: '대리' },
    { id: 'grade-6', name: '사원' },
  ],
  'tenant-2': [
    { id: 'grade-1', name: '수석연구원' },
    { id: 'grade-2', name: '책임연구원' },
    { id: 'grade-3', name: '선임연구원' },
    { id: 'grade-4', name: '연구원' },
  ],
  'tenant-3': [
    { id: 'grade-1', name: '부장' },
    { id: 'grade-2', name: '차장' },
    { id: 'grade-3', name: '과장' },
    { id: 'grade-4', name: '사원' },
  ],
  'tenant-4': [
    { id: 'grade-1', name: '이사' },
    { id: 'grade-2', name: '부장' },
    { id: 'grade-3', name: '과장' },
    { id: 'grade-4', name: '대리' },
    { id: 'grade-5', name: '사원' },
  ],
};

// Mock transfer requests
const mockTransfers: TransferRequest[] = [
  {
    id: 'transfer-1',
    tenantId: 'tenant-1',
    requestNumber: 'TRF-2026-0001',
    type: 'TRANSFER_OUT',
    status: 'PENDING_SOURCE',
    employeeId: 'emp-1',
    employeeName: '김철수',
    employeeNumber: 'E2020001',
    currentDepartment: '인사팀',
    currentPosition: '팀장',
    currentGrade: '부장',
    sourceTenantId: 'tenant-1',
    sourceTenantName: 'HR그룹 본사',
    sourceDepartmentId: 'dept-hq-2',
    sourceDepartmentName: '인사팀',
    targetTenantId: 'tenant-2',
    targetTenantName: 'HR그룹 전자',
    targetDepartmentId: 'dept-el-1',
    targetDepartmentName: '연구개발본부',
    targetPositionId: 'pos-2',
    targetPositionName: '팀장',
    targetGradeId: 'grade-2',
    targetGradeName: '책임연구원',
    requestedDate: '2026-01-20',
    effectiveDate: '2026-03-01',
    reason: '그룹 전략에 따른 인력 재배치',
    remarks: '연구개발 강화를 위한 경험자 이동',
    handoverItems: '1. 진행 중인 채용 프로젝트 인수인계\n2. 팀 운영 관련 문서 전달\n3. 협력업체 연락처 공유',
    requesterId: 'user-1',
    requesterName: '박관리',
    requesterDepartment: '인사팀',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'transfer-2',
    tenantId: 'tenant-1',
    requestNumber: 'TRF-2026-0002',
    type: 'TRANSFER_IN',
    status: 'PENDING_TARGET',
    employeeId: 'emp-2',
    employeeName: '이영희',
    employeeNumber: 'E2021015',
    currentDepartment: '무역사업부',
    currentPosition: '팀장',
    currentGrade: '차장',
    sourceTenantId: 'tenant-3',
    sourceTenantName: 'HR그룹 물산',
    sourceDepartmentId: 'dept-tr-1',
    sourceDepartmentName: '무역사업부',
    targetTenantId: 'tenant-1',
    targetTenantName: 'HR그룹 본사',
    targetDepartmentId: 'dept-hq-1',
    targetDepartmentName: '경영지원본부',
    targetPositionId: 'pos-2',
    targetPositionName: '팀장',
    targetGradeId: 'grade-3',
    targetGradeName: '차장',
    requestedDate: '2026-01-22',
    effectiveDate: '2026-02-15',
    reason: '해외사업 경험 활용',
    handoverItems: '1. 수출입 계약 현황\n2. 해외 거래처 관리',
    requesterId: 'user-2',
    requesterName: '김담당',
    requesterDepartment: '인사팀',
    sourceApprovedAt: '2026-01-25T14:00:00Z',
    sourceApprovedBy: 'user-3',
    sourceApproverName: '최본부장',
    createdAt: '2026-01-22T09:00:00Z',
    updatedAt: '2026-01-25T14:00:00Z',
  },
  {
    id: 'transfer-3',
    tenantId: 'tenant-1',
    requestNumber: 'TRF-2026-0003',
    type: 'SECONDMENT',
    status: 'APPROVED',
    employeeId: 'emp-3',
    employeeName: '박민수',
    employeeNumber: 'E2019008',
    currentDepartment: '재무팀',
    currentPosition: '',
    currentGrade: '과장',
    sourceTenantId: 'tenant-1',
    sourceTenantName: 'HR그룹 본사',
    sourceDepartmentId: 'dept-hq-3',
    sourceDepartmentName: '재무팀',
    targetTenantId: 'tenant-4',
    targetTenantName: 'HR그룹 건설',
    targetDepartmentId: 'dept-cs-1',
    targetDepartmentName: '건축사업부',
    targetGradeId: 'grade-3',
    targetGradeName: '과장',
    requestedDate: '2026-01-26',
    effectiveDate: '2026-02-01',
    returnDate: '2026-12-31',
    reason: '신규 프로젝트 재무 지원 파견',
    remarks: '11개월 파견 예정',
    handoverItems: '1. 분기별 결산 업무 인계\n2. 세무 신고 일정 공유',
    requesterId: 'user-1',
    requesterName: '박관리',
    requesterDepartment: '인사팀',
    sourceApprovedAt: '2026-01-28T11:00:00Z',
    sourceApprovedBy: 'user-4',
    sourceApproverName: '정이사',
    targetApprovedAt: '2026-01-29T16:00:00Z',
    targetApprovedBy: 'user-5',
    targetApproverName: '강사장',
    createdAt: '2026-01-26T10:00:00Z',
    updatedAt: '2026-01-29T16:00:00Z',
  },
  {
    id: 'transfer-4',
    tenantId: 'tenant-2',
    requestNumber: 'TRF-2026-0004',
    type: 'TRANSFER_OUT',
    status: 'COMPLETED',
    employeeId: 'emp-4',
    employeeName: '최지현',
    employeeNumber: 'E2018022',
    currentDepartment: '영업팀',
    currentPosition: '파트장',
    currentGrade: '연구원',
    sourceTenantId: 'tenant-2',
    sourceTenantName: 'HR그룹 전자',
    sourceDepartmentId: 'dept-el-3',
    sourceDepartmentName: '영업팀',
    targetTenantId: 'tenant-3',
    targetTenantName: 'HR그룹 물산',
    targetDepartmentId: 'dept-tr-1',
    targetDepartmentName: '무역사업부',
    targetPositionId: 'pos-2',
    targetPositionName: '팀장',
    targetGradeId: 'grade-3',
    targetGradeName: '과장',
    requestedDate: '2025-12-15',
    effectiveDate: '2026-01-02',
    reason: '해외영업 경험을 활용한 무역사업 강화',
    requesterId: 'user-6',
    requesterName: '윤담당',
    requesterDepartment: '인사팀',
    sourceApprovedAt: '2025-12-20T10:00:00Z',
    sourceApprovedBy: 'user-7',
    sourceApproverName: '한본부장',
    targetApprovedAt: '2025-12-22T14:00:00Z',
    targetApprovedBy: 'user-8',
    targetApproverName: '송대표',
    completedAt: '2026-01-02T09:00:00Z',
    createdAt: '2025-12-15T09:00:00Z',
    updatedAt: '2026-01-02T09:00:00Z',
  },
  {
    id: 'transfer-5',
    tenantId: 'tenant-4',
    requestNumber: 'TRF-2026-0005',
    type: 'TRANSFER_IN',
    status: 'REJECTED',
    employeeId: 'emp-5',
    employeeName: '정수민',
    employeeNumber: 'E2022033',
    currentDepartment: '토목사업부',
    currentPosition: '',
    currentGrade: '사원',
    sourceTenantId: 'tenant-4',
    sourceTenantName: 'HR그룹 건설',
    sourceDepartmentId: 'dept-cs-2',
    sourceDepartmentName: '토목사업부',
    targetTenantId: 'tenant-1',
    targetTenantName: 'HR그룹 본사',
    targetDepartmentId: 'dept-hq-2',
    targetDepartmentName: '인사팀',
    targetGradeId: 'grade-5',
    targetGradeName: '대리',
    requestedDate: '2026-01-15',
    effectiveDate: '2026-02-01',
    reason: '본사 HR 업무 경험 확대',
    requesterId: 'user-9',
    requesterName: '임담당',
    requesterDepartment: '인사팀',
    sourceApprovedAt: '2026-01-18T15:00:00Z',
    sourceApprovedBy: 'user-10',
    sourceApproverName: '조부장',
    targetComment: '현재 인사팀 정원 초과로 인력 수용 불가',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-19T11:00:00Z',
  },
  {
    id: 'transfer-6',
    tenantId: 'tenant-1',
    requestNumber: 'TRF-2026-0006',
    type: 'TRANSFER_OUT',
    status: 'DRAFT',
    employeeId: 'emp-6',
    employeeName: '한지우',
    employeeNumber: 'E2023045',
    currentDepartment: '인사팀',
    currentPosition: '',
    currentGrade: '사원',
    sourceTenantId: 'tenant-1',
    sourceTenantName: 'HR그룹 본사',
    sourceDepartmentId: 'dept-hq-2',
    sourceDepartmentName: '인사팀',
    targetTenantId: 'tenant-2',
    targetTenantName: 'HR그룹 전자',
    requestedDate: '2026-02-01',
    effectiveDate: '2026-04-01',
    reason: '제조업 HR 경험 습득',
    requesterId: 'user-1',
    requesterName: '박관리',
    requesterDepartment: '인사팀',
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
  },
];

// Mock handover items
const mockHandoverItems: Record<string, HandoverItem[]> = {
  'transfer-1': [
    {
      id: 'item-1',
      transferId: 'transfer-1',
      category: '프로젝트',
      title: '채용 프로젝트 인계',
      description: '진행 중인 채용 프로젝트 인수인계',
      isCompleted: false,
    },
    {
      id: 'item-2',
      transferId: 'transfer-1',
      category: '문서',
      title: '팀 운영 문서',
      description: '팀 운영 관련 문서 전달',
      isCompleted: false,
    },
    {
      id: 'item-3',
      transferId: 'transfer-1',
      category: '연락처',
      title: '협력업체 연락처',
      description: '협력업체 연락처 공유',
      isCompleted: false,
    },
  ],
  'transfer-2': [
    {
      id: 'item-4',
      transferId: 'transfer-2',
      category: '계약',
      title: '수출입 계약 현황',
      description: '수출입 계약 현황 인계',
      isCompleted: true,
      completedAt: '2026-01-26T10:00:00Z',
      completedBy: 'user-2',
    },
    {
      id: 'item-5',
      transferId: 'transfer-2',
      category: '문서',
      title: '해외 거래처 관리',
      description: '해외 거래처 관리 문서',
      isCompleted: false,
    },
  ],
  'transfer-3': [
    {
      id: 'item-6',
      transferId: 'transfer-3',
      category: '업무',
      title: '분기별 결산',
      description: '분기별 결산 업무 인계',
      isCompleted: true,
      completedAt: '2026-01-30T09:00:00Z',
      completedBy: 'emp-3',
    },
    {
      id: 'item-7',
      transferId: 'transfer-3',
      category: '일정',
      title: '세무 신고 일정',
      description: '세무 신고 일정 공유',
      isCompleted: true,
      completedAt: '2026-01-30T11:00:00Z',
      completedBy: 'emp-3',
    },
  ],
};

function toListItem(transfer: TransferRequest): TransferRequestListItem {
  return {
    id: transfer.id,
    requestNumber: transfer.requestNumber,
    type: transfer.type,
    status: transfer.status,
    employeeName: transfer.employeeName,
    employeeNumber: transfer.employeeNumber,
    sourceTenantName: transfer.sourceTenantName,
    targetTenantName: transfer.targetTenantName,
    effectiveDate: transfer.effectiveDate,
    requestedDate: transfer.requestedDate,
    requesterName: transfer.requesterName,
  };
}

export const transferHandlers = [
  // Get transfer list
  http.get('/api/v1/transfers', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');
    const keyword = url.searchParams.get('keyword') || '';
    const type = url.searchParams.get('type') as TransferType | null;
    const status = url.searchParams.get('status') as TransferStatus | null;

    let filtered = [...mockTransfers];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.employeeName.toLowerCase().includes(lower) ||
          t.employeeNumber.toLowerCase().includes(lower) ||
          t.requestNumber.toLowerCase().includes(lower)
      );
    }

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = page * size;
    const paged = filtered.slice(start, start + size);

    return HttpResponse.json({
      success: true,
      data: {
        content: paged.map(toListItem),
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      },
    });
  }),

  // Get transfer summary
  http.get('/api/v1/transfers/summary', async () => {
    await delay(200);

    const summary: TransferSummary = {
      pendingSourceCount: mockTransfers.filter((t) => t.status === 'PENDING_SOURCE').length,
      pendingTargetCount: mockTransfers.filter((t) => t.status === 'PENDING_TARGET').length,
      approvedCount: mockTransfers.filter((t) => t.status === 'APPROVED').length,
      completedThisMonth: mockTransfers.filter((t) => {
        if (t.status !== 'COMPLETED' || !t.completedAt) return false;
        const completed = new Date(t.completedAt);
        const now = new Date();
        return (
          completed.getMonth() === now.getMonth() &&
          completed.getFullYear() === now.getFullYear()
        );
      }).length,
    };

    return HttpResponse.json({
      success: true,
      data: summary,
    });
  }),

  // Get available tenants
  http.get('/api/v1/transfers/available-tenants', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: mockTenants,
    });
  }),

  // Get tenant departments
  http.get('/api/v1/transfers/tenants/:tenantId/departments', async ({ params }) => {
    await delay(200);

    const { tenantId } = params;
    const departments = mockDepartments[tenantId as string] || [];

    return HttpResponse.json({
      success: true,
      data: departments,
    });
  }),

  // Get tenant positions
  http.get('/api/v1/transfers/tenants/:tenantId/positions', async ({ params }) => {
    await delay(200);

    const { tenantId } = params;
    const positions = mockPositions[tenantId as string] || [];

    return HttpResponse.json({
      success: true,
      data: positions,
    });
  }),

  // Get tenant grades
  http.get('/api/v1/transfers/tenants/:tenantId/grades', async ({ params }) => {
    await delay(200);

    const { tenantId } = params;
    const grades = mockGrades[tenantId as string] || [];

    return HttpResponse.json({
      success: true,
      data: grades,
    });
  }),

  // Get transfer detail
  http.get('/api/v1/transfers/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const transfer = mockTransfers.find((t) => t.id === id);

    if (!transfer) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: transfer,
    });
  }),

  // Create transfer
  http.post('/api/v1/transfers', async ({ request }) => {
    await delay(400);

    const body = await request.json();
    const newId = `transfer-${Date.now()}`;
    const requestNumber = `TRF-2026-${String(mockTransfers.length + 1).padStart(4, '0')}`;

    const targetTenant = mockTenants.find((t) => t.id === (body as any).targetTenantId);
    const targetDept = mockDepartments[(body as any).targetTenantId]?.find(
      (d) => d.id === (body as any).targetDepartmentId
    );
    const targetPos = mockPositions[(body as any).targetTenantId]?.find(
      (p) => p.id === (body as any).targetPositionId
    );
    const targetGrade = mockGrades[(body as any).targetTenantId]?.find(
      (g) => g.id === (body as any).targetGradeId
    );

    const newTransfer: TransferRequest = {
      id: newId,
      tenantId: 'tenant-1',
      requestNumber,
      type: (body as any).type,
      status: 'DRAFT',
      employeeId: (body as any).employeeId,
      employeeName: '신규직원',
      employeeNumber: 'E2020XXX',
      currentDepartment: '인사팀',
      currentPosition: '',
      currentGrade: '대리',
      sourceTenantId: 'tenant-1',
      sourceTenantName: 'HR그룹 본사',
      sourceDepartmentId: 'dept-hq-2',
      sourceDepartmentName: '인사팀',
      targetTenantId: (body as any).targetTenantId,
      targetTenantName: targetTenant?.name || '',
      targetDepartmentId: (body as any).targetDepartmentId,
      targetDepartmentName: targetDept?.name,
      targetPositionId: (body as any).targetPositionId,
      targetPositionName: targetPos?.name,
      targetGradeId: (body as any).targetGradeId,
      targetGradeName: targetGrade?.name,
      requestedDate: new Date().toISOString().split('T')[0],
      effectiveDate: (body as any).effectiveDate,
      returnDate: (body as any).returnDate,
      reason: (body as any).reason,
      remarks: (body as any).remarks,
      handoverItems: (body as any).handoverItems,
      requesterId: 'user-1',
      requesterName: '현재사용자',
      requesterDepartment: '인사팀',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTransfers.unshift(newTransfer);

    return HttpResponse.json({
      success: true,
      data: newTransfer,
    });
  }),

  // Update transfer
  http.put('/api/v1/transfers/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json();
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'DRAFT') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '임시저장 상태에서만 수정 가능합니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Submit transfer
  http.post('/api/v1/transfers/:id/submit', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'DRAFT') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '임시저장 상태에서만 상신 가능합니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'PENDING_SOURCE' as TransferStatus,
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Approve source (전출 승인)
  http.post('/api/v1/transfers/:id/approve-source', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'PENDING_SOURCE') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '전출 승인 대기 상태가 아닙니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'PENDING_TARGET' as TransferStatus,
      sourceApprovedBy: 'user-current',
      sourceApproverName: '현재사용자',
      sourceApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Approve target (전입 승인)
  http.post('/api/v1/transfers/:id/approve-target', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'PENDING_TARGET') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '전입 승인 대기 상태가 아닙니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'APPROVED' as TransferStatus,
      targetApprovedBy: 'user-current',
      targetApproverName: '현재사용자',
      targetApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Reject transfer
  http.post('/api/v1/transfers/:id/reject', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = (await request.json()) as { reason: string };
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (!['PENDING_SOURCE', 'PENDING_TARGET'].includes(transfer.status)) {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '승인 대기 상태가 아닙니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'REJECTED' as TransferStatus,
      targetComment: body.reason,
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Complete transfer
  http.post('/api/v1/transfers/:id/complete', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'APPROVED') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '승인 완료 상태가 아닙니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'COMPLETED' as TransferStatus,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Cancel transfer
  http.post('/api/v1/transfers/:id/cancel', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = (await request.json()) as { reason: string };
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (['COMPLETED', 'CANCELLED'].includes(transfer.status)) {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '완료 또는 취소된 요청은 취소할 수 없습니다.' } },
        { status: 400 }
      );
    }

    const updated = {
      ...transfer,
      status: 'CANCELLED' as TransferStatus,
      cancelledAt: new Date().toISOString(),
      cancelReason: body.reason,
      updatedAt: new Date().toISOString(),
    };
    mockTransfers[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Delete transfer (draft only)
  http.delete('/api/v1/transfers/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockTransfers.findIndex((t) => t.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const transfer = mockTransfers[index];
    if (transfer.status !== 'DRAFT') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: '임시저장 상태에서만 삭제 가능합니다.' } },
        { status: 400 }
      );
    }

    mockTransfers.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Get handover items
  http.get('/api/v1/transfers/:transferId/handover-items', async ({ params }) => {
    await delay(200);

    const { transferId } = params;
    const items = mockHandoverItems[transferId as string] || [];

    return HttpResponse.json({
      success: true,
      data: items,
    });
  }),

  // Complete handover item
  http.post('/api/v1/transfers/:transferId/handover-items/:itemId/complete', async ({ params }) => {
    await delay(200);

    const { transferId, itemId } = params;
    const items = mockHandoverItems[transferId as string];

    if (!items) {
      return HttpResponse.json(
        { success: false, error: { code: 'TRANSFER_NOT_FOUND', message: '인사이동 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'ITEM_NOT_FOUND', message: '인수인계 항목을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updated: HandoverItem = {
      ...items[index],
      isCompleted: true,
      completedAt: new Date().toISOString(),
      completedBy: 'user-current',
    };
    items[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),
];
