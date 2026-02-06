import { http, HttpResponse, delay } from 'msw';
import type {
  HeadcountPlan,
  HeadcountPlanListItem,
  HeadcountRequest,
  HeadcountRequestListItem,
  HeadcountSummary,
  HeadcountStatus,
  HeadcountRequestStatus,
  HeadcountRequestType,
} from '@hr-platform/shared-types';

// Mock headcount plans
const mockPlans: HeadcountPlan[] = [
  {
    id: 'hc-plan-1',
    year: 2026,
    departmentId: 'dept-1',
    departmentName: '경영지원본부',
    departmentCode: 'MGMT',
    gradeId: 'grade-4',
    gradeName: '과장',
    plannedCount: 10,
    actualCount: 8,
    variance: -2,
    status: 'ACTIVE',
    approvedBy: 'user-1',
    approvedByName: '김이사',
    approvedAt: '2025-12-15T10:00:00Z',
    remarks: null,
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'hc-plan-2',
    year: 2026,
    departmentId: 'dept-1',
    departmentName: '경영지원본부',
    departmentCode: 'MGMT',
    gradeId: 'grade-5',
    gradeName: '대리',
    plannedCount: 15,
    actualCount: 15,
    variance: 0,
    status: 'ACTIVE',
    approvedBy: 'user-1',
    approvedByName: '김이사',
    approvedAt: '2025-12-15T10:00:00Z',
    remarks: null,
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'hc-plan-3',
    year: 2026,
    departmentId: 'dept-2',
    departmentName: '개발본부',
    departmentCode: 'DEV',
    gradeId: 'grade-4',
    gradeName: '과장',
    plannedCount: 20,
    actualCount: 22,
    variance: 2,
    status: 'ACTIVE',
    approvedBy: 'user-1',
    approvedByName: '김이사',
    approvedAt: '2025-12-15T10:00:00Z',
    remarks: null,
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'hc-plan-4',
    year: 2026,
    departmentId: 'dept-2',
    departmentName: '개발본부',
    departmentCode: 'DEV',
    gradeId: 'grade-5',
    gradeName: '대리',
    plannedCount: 30,
    actualCount: 28,
    variance: -2,
    status: 'ACTIVE',
    approvedBy: 'user-1',
    approvedByName: '김이사',
    approvedAt: '2025-12-15T10:00:00Z',
    remarks: null,
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'hc-plan-5',
    year: 2026,
    departmentId: 'dept-3',
    departmentName: '영업본부',
    departmentCode: 'SALES',
    gradeId: 'grade-4',
    gradeName: '과장',
    plannedCount: 12,
    actualCount: 10,
    variance: -2,
    status: 'APPROVED',
    approvedBy: 'user-1',
    approvedByName: '김이사',
    approvedAt: '2026-01-10T10:00:00Z',
    remarks: '2분기 증원 예정',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'hc-plan-6',
    year: 2027,
    departmentId: 'dept-1',
    departmentName: '경영지원본부',
    departmentCode: 'MGMT',
    gradeId: 'grade-4',
    gradeName: '과장',
    plannedCount: 12,
    actualCount: 0,
    variance: -12,
    status: 'DRAFT',
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    remarks: '2027년 계획 초안',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
];

// Mock headcount requests
const mockRequests: HeadcountRequest[] = [
  {
    id: 'hc-req-1',
    requestNumber: 'HCR-2026-0001',
    type: 'INCREASE',
    status: 'PENDING',
    departmentId: 'dept-2',
    departmentName: '개발본부',
    gradeId: 'grade-5',
    gradeName: '대리',
    requestedCount: 32,
    currentCount: 28,
    reason: '신규 프로젝트 투입 인원 확보',
    effectiveDate: '2026-03-01',
    requesterId: 'user-2',
    requesterName: '박본부장',
    approverId: null,
    approverName: null,
    approvedAt: null,
    rejectionReason: null,
    remarks: 'AI 프로젝트 관련',
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'hc-req-2',
    requestNumber: 'HCR-2026-0002',
    type: 'DECREASE',
    status: 'APPROVED',
    departmentId: 'dept-3',
    departmentName: '영업본부',
    gradeId: 'grade-6',
    gradeName: '사원',
    requestedCount: 15,
    currentCount: 18,
    reason: '업무 효율화에 따른 정원 조정',
    effectiveDate: '2026-02-01',
    requesterId: 'user-3',
    requesterName: '이본부장',
    approverId: 'user-1',
    approverName: '김이사',
    approvedAt: '2026-01-20T15:00:00Z',
    rejectionReason: null,
    remarks: null,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-20T15:00:00Z',
  },
  {
    id: 'hc-req-3',
    requestNumber: 'HCR-2026-0003',
    type: 'TRANSFER',
    status: 'REJECTED',
    departmentId: 'dept-1',
    departmentName: '경영지원본부',
    gradeId: 'grade-5',
    gradeName: '대리',
    requestedCount: 17,
    currentCount: 15,
    reason: '타 부서 인력 전환 배치',
    effectiveDate: '2026-02-15',
    requesterId: 'user-4',
    requesterName: '최팀장',
    approverId: 'user-1',
    approverName: '김이사',
    approvedAt: null,
    rejectionReason: '전환 대상 부서 협의 미완료',
    remarks: null,
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-18T11:00:00Z',
  },
];

function toPlanListItem(plan: HeadcountPlan): HeadcountPlanListItem {
  return {
    id: plan.id,
    year: plan.year,
    departmentId: plan.departmentId,
    departmentName: plan.departmentName,
    departmentCode: plan.departmentCode,
    gradeId: plan.gradeId,
    gradeName: plan.gradeName,
    plannedCount: plan.plannedCount,
    actualCount: plan.actualCount,
    variance: plan.variance,
    status: plan.status,
  };
}

function toRequestListItem(request: HeadcountRequest): HeadcountRequestListItem {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    type: request.type,
    status: request.status,
    departmentName: request.departmentName,
    gradeName: request.gradeName,
    requestedCount: request.requestedCount,
    currentCount: request.currentCount,
    requesterName: request.requesterName,
    effectiveDate: request.effectiveDate,
    createdAt: request.createdAt,
  };
}

export const headcountHandlers = [
  // Get headcount plans - Backend returns List (array), not Page
  // Hook does client-side pagination
  http.get('/api/v1/headcounts/plans', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const departmentId = url.searchParams.get('departmentId');

    let filtered = [...mockPlans];

    if (year) {
      filtered = filtered.filter((p) => p.year === parseInt(year));
    }

    if (departmentId) {
      filtered = filtered.filter((p) => p.departmentId === departmentId);
    }

    filtered.sort((a, b) => a.departmentName.localeCompare(b.departmentName));

    // Return array directly - hook handles pagination client-side
    return HttpResponse.json({
      success: true,
      data: filtered.map(toPlanListItem),
    });
  }),

  // Get headcount plan detail
  http.get('/api/v1/headcounts/plans/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const plan = mockPlans.find((p) => p.id === id);

    if (!plan) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '정현원 계획을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: plan,
    });
  }),

  // Create headcount plan
  http.post('/api/v1/headcounts/plans', async ({ request }) => {
    await delay(400);

    const body = await request.json() as any;
    const newPlan: HeadcountPlan = {
      id: `hc-plan-${Date.now()}`,
      year: body.year,
      departmentId: body.departmentId,
      departmentName: '새 부서',
      departmentCode: 'NEW',
      gradeId: body.gradeId,
      gradeName: '새 직급',
      plannedCount: body.plannedCount,
      actualCount: 0,
      variance: -body.plannedCount,
      status: 'DRAFT',
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      remarks: body.remarks || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPlans.push(newPlan);

    return HttpResponse.json({
      success: true,
      data: newPlan,
    });
  }),

  // Update headcount plan
  http.put('/api/v1/headcounts/plans/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as any;
    const index = mockPlans.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '정현원 계획을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const plan = mockPlans[index];
    const updated = {
      ...plan,
      plannedCount: body.plannedCount ?? plan.plannedCount,
      variance: (body.plannedCount ?? plan.plannedCount) - plan.actualCount,
      remarks: body.remarks ?? plan.remarks,
      updatedAt: new Date().toISOString(),
    };
    mockPlans[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Delete headcount plan
  http.delete('/api/v1/headcounts/plans/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const index = mockPlans.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '정현원 계획을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    mockPlans.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // Approve headcount plan
  http.post('/api/v1/headcounts/plans/:id/approve', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockPlans.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '정현원 계획을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updated = {
      ...mockPlans[index],
      status: 'APPROVED' as HeadcountStatus,
      approvedBy: 'user-current',
      approvedByName: '현재사용자',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPlans[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Get headcount summary
  http.get('/api/v1/headcounts/summary', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    const yearPlans = mockPlans.filter((p) => p.year === year);

    const totalPlanned = yearPlans.reduce((sum, p) => sum + p.plannedCount, 0);
    const totalActual = yearPlans.reduce((sum, p) => sum + p.actualCount, 0);

    // Group by department
    const deptMap = new Map<string, { id: string; name: string; code: string; planned: number; actual: number }>();
    yearPlans.forEach((p) => {
      const existing = deptMap.get(p.departmentId) || {
        id: p.departmentId,
        name: p.departmentName,
        code: p.departmentCode,
        planned: 0,
        actual: 0,
      };
      existing.planned += p.plannedCount;
      existing.actual += p.actualCount;
      deptMap.set(p.departmentId, existing);
    });

    const summary: HeadcountSummary = {
      year,
      totalPlanned,
      totalActual,
      totalVariance: totalActual - totalPlanned,
      departmentSummaries: Array.from(deptMap.values()).map((d) => ({
        departmentId: d.id,
        departmentName: d.name,
        departmentCode: d.code,
        plannedCount: d.planned,
        actualCount: d.actual,
        variance: d.actual - d.planned,
        vacancies: Math.max(0, d.planned - d.actual),
      })),
    };

    return HttpResponse.json({
      success: true,
      data: summary,
    });
  }),

  // Get headcount requests
  http.get('/api/v1/headcounts/requests', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');
    const type = url.searchParams.get('type') as HeadcountRequestType | null;
    const status = url.searchParams.get('status') as HeadcountRequestStatus | null;
    const departmentId = url.searchParams.get('departmentId');

    let filtered = [...mockRequests];

    if (type) {
      filtered = filtered.filter((r) => r.type === type);
    }

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (departmentId) {
      filtered = filtered.filter((r) => r.departmentId === departmentId);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = page * size;
    const paged = filtered.slice(start, start + size);

    return HttpResponse.json({
      success: true,
      data: {
        content: paged.map(toRequestListItem),
        page: {
          number: page,
          size,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size),
          first: page === 0,
          last: page >= Math.ceil(filtered.length / size) - 1,
          hasNext: page < Math.ceil(filtered.length / size) - 1,
          hasPrevious: page > 0,
        },
      },
    });
  }),

  // Get headcount request detail
  http.get('/api/v1/headcounts/requests/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const request = mockRequests.find((r) => r.id === id);

    if (!request) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '변경 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: request,
    });
  }),

  // Create headcount request
  http.post('/api/v1/headcounts/requests', async ({ request }) => {
    await delay(400);

    const body = await request.json() as any;
    const newRequest: HeadcountRequest = {
      id: `hc-req-${Date.now()}`,
      requestNumber: `HCR-2026-${String(mockRequests.length + 1).padStart(4, '0')}`,
      type: body.type,
      status: 'PENDING',
      departmentId: body.departmentId,
      departmentName: '요청 부서',
      gradeId: body.gradeId,
      gradeName: '요청 직급',
      requestedCount: body.requestedCount,
      currentCount: 10, // Would be fetched from actual data
      reason: body.reason,
      effectiveDate: body.effectiveDate,
      requesterId: 'user-current',
      requesterName: '현재사용자',
      approverId: null,
      approverName: null,
      approvedAt: null,
      rejectionReason: null,
      remarks: body.remarks || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
    });
  }),

  // Approve headcount request
  http.post('/api/v1/headcounts/requests/:id/approve', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockRequests.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '변경 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updated = {
      ...mockRequests[index],
      status: 'APPROVED' as HeadcountRequestStatus,
      approverId: 'user-current',
      approverName: '현재사용자',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequests[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Reject headcount request
  http.post('/api/v1/headcounts/requests/:id/reject', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as { reason: string };
    const index = mockRequests.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '변경 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updated = {
      ...mockRequests[index],
      status: 'REJECTED' as HeadcountRequestStatus,
      rejectionReason: body.reason,
      updatedAt: new Date().toISOString(),
    };
    mockRequests[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  // Cancel headcount request
  http.post('/api/v1/headcounts/requests/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockRequests.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '변경 요청을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updated = {
      ...mockRequests[index],
      status: 'CANCELLED' as HeadcountRequestStatus,
      updatedAt: new Date().toISOString(),
    };
    mockRequests[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),
];
