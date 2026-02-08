import { http, HttpResponse, delay } from 'msw';
import { format, subDays, addDays } from 'date-fns';
import type {
  AppointmentDraft,
  AppointmentDraftListItem,
  AppointmentDetail,
  DraftStatus,
  DetailStatus,
  AppointmentType,
  AppointmentSummary,
} from '@hr-platform/shared-types';

// ============================================
// Mock Data
// ============================================

const mockDetails: AppointmentDetail[] = [
  {
    id: 'detail-001',
    employeeId: 'emp-002',
    employeeName: '김철수',
    employeeNumber: 'EMP-2024-002',
    appointmentType: 'PROMOTION',
    fromDepartmentId: 'dept-001',
    fromDepartmentName: '개발1팀',
    toDepartmentId: 'dept-001',
    toDepartmentName: '개발1팀',
    fromPositionCode: 'pos-002',
    fromPositionName: '팀원',
    toPositionCode: 'pos-003',
    toPositionName: '선임',
    fromGradeCode: 'grade-003',
    fromGradeName: '대리',
    toGradeCode: 'grade-002',
    toGradeName: '과장',
    reason: '우수한 업무 성과',
    status: 'PENDING',
  },
  {
    id: 'detail-002',
    employeeId: 'emp-003',
    employeeName: '이영희',
    employeeNumber: 'EMP-2024-003',
    appointmentType: 'TRANSFER',
    fromDepartmentId: 'dept-002',
    fromDepartmentName: '인사팀',
    toDepartmentId: 'dept-003',
    toDepartmentName: '기획팀',
    fromPositionCode: 'pos-002',
    fromPositionName: '팀원',
    toPositionCode: 'pos-002',
    toPositionName: '팀원',
    fromGradeCode: 'grade-003',
    fromGradeName: '대리',
    toGradeCode: 'grade-003',
    toGradeName: '대리',
    reason: '부서 간 업무 조정',
    status: 'PENDING',
  },
];

const mockDrafts: AppointmentDraft[] = [
  {
    id: 'draft-001',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2026-0001',
    title: '2026년 1분기 정기 인사발령',
    effectiveDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    description: '2026년 1분기 정기 인사발령 건입니다.',
    status: 'DRAFT',
    detailCount: 2,
    draftCreatedBy: { id: 'emp-001', name: '홍길동' },
    details: mockDetails,
    createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'draft-002',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2026-0002',
    title: '개발팀 조직개편 발령',
    effectiveDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    description: '개발팀 조직개편에 따른 인사발령',
    status: 'PENDING_APPROVAL',
    detailCount: 3,
    approvalId: 'approval-001',
    draftCreatedBy: { id: 'emp-001', name: '홍길동' },
    details: [
      {
        id: 'detail-003',
        employeeId: 'emp-004',
        employeeName: '박민수',
        employeeNumber: 'EMP-2024-004',
        appointmentType: 'POSITION_CHANGE',
        fromDepartmentId: 'dept-001',
        fromDepartmentName: '개발1팀',
        toDepartmentId: 'dept-001',
        toDepartmentName: '개발1팀',
        fromPositionCode: 'pos-003',
        fromPositionName: '선임',
        toPositionCode: 'pos-004',
        toPositionName: '파트장',
        fromGradeCode: 'grade-002',
        fromGradeName: '과장',
        toGradeCode: 'grade-002',
        toGradeName: '과장',
        reason: '파트장 직책 부여',
        status: 'PENDING',
      },
    ],
    createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 2), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'draft-003',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2026-0003',
    title: '승진 인사발령',
    effectiveDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    description: '2026년 상반기 승진자 발령',
    status: 'APPROVED',
    detailCount: 1,
    approvalId: 'approval-002',
    approvedAt: format(subDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    draftCreatedBy: { id: 'emp-001', name: '홍길동' },
    details: [
      {
        id: 'detail-004',
        employeeId: 'emp-005',
        employeeName: '최수진',
        employeeNumber: 'EMP-2024-005',
        appointmentType: 'PROMOTION',
        fromDepartmentId: 'dept-004',
        fromDepartmentName: '영업팀',
        toDepartmentId: 'dept-004',
        toDepartmentName: '영업팀',
        fromGradeCode: 'grade-004',
        fromGradeName: '사원',
        toGradeCode: 'grade-003',
        toGradeName: '대리',
        reason: '우수한 영업 실적',
        status: 'PENDING',
      },
    ],
    createdAt: format(subDays(new Date(), 10), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'draft-004',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2025-0050',
    title: '2025년 4분기 정기 인사발령',
    effectiveDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    description: '2025년 4분기 정기 인사발령 건',
    status: 'EXECUTED',
    detailCount: 5,
    approvalId: 'approval-003',
    approvedAt: format(subDays(new Date(), 35), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    executedAt: format(subDays(new Date(), 30), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    draftCreatedBy: { id: 'emp-006', name: '정대현' },
    details: [],
    createdAt: format(subDays(new Date(), 40), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 30), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'draft-005',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2025-0049',
    title: '휴직 발령',
    effectiveDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    description: '육아휴직 발령',
    status: 'EXECUTED',
    detailCount: 1,
    approvalId: 'approval-004',
    approvedAt: format(subDays(new Date(), 65), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    executedAt: format(subDays(new Date(), 60), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    draftCreatedBy: { id: 'emp-001', name: '홍길동' },
    details: [],
    createdAt: format(subDays(new Date(), 70), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 60), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'draft-006',
    tenantId: 'tenant-001',
    draftNumber: 'APT-2025-0048',
    title: '긴급 인사발령 (취소)',
    effectiveDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    description: '취소된 인사발령',
    status: 'CANCELLED',
    detailCount: 2,
    cancelledAt: format(subDays(new Date(), 44), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    cancelReason: '경영진 결정에 따른 취소',
    draftCreatedBy: { id: 'emp-001', name: '홍길동' },
    details: [],
    createdAt: format(subDays(new Date(), 50), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 44), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
];

let drafts = [...mockDrafts];
let draftIdCounter = 7;
let detailIdCounter = 5;

function generateDraftNumber(): string {
  const year = new Date().getFullYear();
  const sequence = String(draftIdCounter).padStart(4, '0');
  return `APT-${year}-${sequence}`;
}

// ============================================
// Handlers
// ============================================

export const appointmentHandlers = [
  // 발령안 목록 조회
  http.get('/api/v1/appointments/drafts', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as DraftStatus | null;
    const keyword = url.searchParams.get('keyword');
    const effectiveDateFrom = url.searchParams.get('effectiveDateFrom');
    const effectiveDateTo = url.searchParams.get('effectiveDateTo');

    let filtered = [...drafts];

    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(lowerKeyword) ||
        d.draftNumber.toLowerCase().includes(lowerKeyword)
      );
    }
    if (effectiveDateFrom) {
      filtered = filtered.filter(d => d.effectiveDate >= effectiveDateFrom);
    }
    if (effectiveDateTo) {
      filtered = filtered.filter(d => d.effectiveDate <= effectiveDateTo);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content: AppointmentDraftListItem[] = filtered.slice(start, start + size).map(d => ({
      id: d.id,
      draftNumber: d.draftNumber,
      title: d.title,
      effectiveDate: d.effectiveDate,
      status: d.status,
      detailCount: d.detailCount,
      draftCreatedBy: d.draftCreatedBy!,
      createdAt: d.createdAt,
    }));

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

  // 발령안 상세 조회
  http.get('/api/v1/appointments/drafts/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const draft = drafts.find(d => d.id === id);

    if (!draft) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: draft,
      timestamp: new Date().toISOString(),
    });
  }),

  // 발령안 생성
  http.post('/api/v1/appointments/drafts', async ({ request }) => {
    await delay(300);

    const body = await request.json() as {
      title: string;
      effectiveDate: string;
      description?: string;
      details?: {
        employeeId: string;
        appointmentType: AppointmentType;
        toDepartmentId?: string;
        toPositionCode?: string;
        toGradeCode?: string;
        toJobCode?: string;
        reason?: string;
      }[];
    };

    const newDetails: AppointmentDetail[] = (body.details || []).map((d, index) => ({
      id: `detail-${detailIdCounter + index}`,
      employeeId: d.employeeId,
      employeeName: `직원 ${d.employeeId}`,
      employeeNumber: `EMP-${d.employeeId}`,
      appointmentType: d.appointmentType,
      toDepartmentId: d.toDepartmentId,
      toDepartmentName: d.toDepartmentId ? '부서명' : undefined,
      toPositionCode: d.toPositionCode,
      toPositionName: d.toPositionCode ? '직책명' : undefined,
      toGradeCode: d.toGradeCode,
      toGradeName: d.toGradeCode ? '직급명' : undefined,
      toJobCode: d.toJobCode,
      toJobName: d.toJobCode ? '직무명' : undefined,
      reason: d.reason,
      status: 'PENDING' as DetailStatus,
    }));

    detailIdCounter += newDetails.length;

    const newDraft: AppointmentDraft = {
      id: `draft-${String(draftIdCounter++).padStart(3, '0')}`,
      tenantId: 'tenant-001',
      draftNumber: generateDraftNumber(),
      title: body.title,
      effectiveDate: body.effectiveDate,
      description: body.description,
      status: 'DRAFT',
      detailCount: newDetails.length,
      draftCreatedBy: { id: 'emp-001', name: '홍길동' },
      details: newDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    drafts.unshift(newDraft);

    return HttpResponse.json({
      success: true,
      data: newDraft,
      message: '발령안이 생성되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // 발령안 수정
  http.put('/api/v1/appointments/drafts/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as {
      title?: string;
      effectiveDate?: string;
      description?: string;
    };

    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[index].status !== 'DRAFT') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_002', message: '임시저장 상태의 발령안만 수정할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    drafts[index] = {
      ...drafts[index],
      title: body.title ?? drafts[index].title,
      effectiveDate: body.effectiveDate ?? drafts[index].effectiveDate,
      description: body.description ?? drafts[index].description,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: drafts[index],
      message: '발령안이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 발령안 삭제
  http.delete('/api/v1/appointments/drafts/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[index].status !== 'DRAFT') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_003', message: '임시저장 상태의 발령안만 삭제할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    drafts.splice(index, 1);

    return HttpResponse.json({
      success: true,
      message: '발령안이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 발령 상세 추가
  http.post('/api/v1/appointments/drafts/:id/details', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as {
      employeeId: string;
      appointmentType: AppointmentType;
      toDepartmentId?: string;
      toPositionCode?: string;
      toGradeCode?: string;
      toJobCode?: string;
      reason?: string;
    };

    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[index].status !== 'DRAFT') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_004', message: '임시저장 상태의 발령안에만 상세를 추가할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Mock employee data lookup
    const employeeData: Record<string, { name: string; number: string; dept: string; deptId: string; grade: string; gradeId: string; position?: string; positionId?: string }> = {
      'emp-002': { name: '김철수', number: 'EMP-2024-002', dept: '개발1팀', deptId: 'dept-001', grade: '대리', gradeId: 'grade-003', position: '팀원', positionId: 'pos-002' },
      'emp-003': { name: '이영희', number: 'EMP-2024-003', dept: '인사팀', deptId: 'dept-002', grade: '대리', gradeId: 'grade-003', position: '팀원', positionId: 'pos-002' },
      'emp-004': { name: '박민수', number: 'EMP-2024-004', dept: '개발1팀', deptId: 'dept-001', grade: '과장', gradeId: 'grade-002', position: '선임', positionId: 'pos-003' },
      'emp-005': { name: '최수진', number: 'EMP-2024-005', dept: '영업팀', deptId: 'dept-004', grade: '사원', gradeId: 'grade-004' },
      'emp-006': { name: '정대현', number: 'EMP-2024-006', dept: '재무팀', deptId: 'dept-005', grade: '과장', gradeId: 'grade-002' },
      'emp-007': { name: '강민지', number: 'EMP-2024-007', dept: '개발2팀', deptId: 'dept-006', grade: '대리', gradeId: 'grade-003' },
    };

    const emp = employeeData[body.employeeId] || { name: '알 수 없음', number: body.employeeId, dept: '미지정', deptId: '', grade: '미지정', gradeId: '' };

    const newDetail: AppointmentDetail = {
      id: `detail-${String(detailIdCounter++).padStart(3, '0')}`,
      employeeId: body.employeeId,
      employeeName: emp.name,
      employeeNumber: emp.number,
      appointmentType: body.appointmentType,
      fromDepartmentId: emp.deptId,
      fromDepartmentName: emp.dept,
      toDepartmentId: body.toDepartmentId,
      toDepartmentName: body.toDepartmentId ? '대상 부서' : undefined,
      fromPositionCode: emp.positionId,
      fromPositionName: emp.position,
      toPositionCode: body.toPositionCode,
      toPositionName: body.toPositionCode ? '대상 직책' : undefined,
      fromGradeCode: emp.gradeId,
      fromGradeName: emp.grade,
      toGradeCode: body.toGradeCode,
      toGradeName: body.toGradeCode ? '대상 직급' : undefined,
      toJobCode: body.toJobCode,
      toJobName: body.toJobCode ? '대상 직무' : undefined,
      reason: body.reason,
      status: 'PENDING',
    };

    drafts[index].details = [...(drafts[index].details || []), newDetail];
    drafts[index].detailCount = drafts[index].details!.length;
    drafts[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: newDetail,
      message: '발령 대상이 추가되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // 발령 상세 삭제
  http.delete('/api/v1/appointments/drafts/:draftId/details/:detailId', async ({ params }) => {
    await delay(300);

    const { draftId, detailId } = params;
    const draftIndex = drafts.findIndex(d => d.id === draftId);

    if (draftIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[draftIndex].status !== 'DRAFT') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_005', message: '임시저장 상태의 발령안에서만 상세를 삭제할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const details = drafts[draftIndex].details || [];
    const detailIndex = details.findIndex(d => d.id === detailId);

    if (detailIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_006', message: '발령 상세를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    details.splice(detailIndex, 1);
    drafts[draftIndex].details = details;
    drafts[draftIndex].detailCount = details.length;
    drafts[draftIndex].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      message: '발령 대상이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 결재 요청
  http.post('/api/v1/appointments/drafts/:id/submit', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[index].status !== 'DRAFT') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_007', message: '임시저장 상태의 발령안만 결재 요청할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!drafts[index].details || drafts[index].details!.length === 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_008', message: '발령 대상이 없습니다. 최소 1명 이상의 대상을 추가해주세요.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    drafts[index].status = 'PENDING_APPROVAL';
    drafts[index].approvalId = `approval-${Date.now()}`;
    drafts[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: drafts[index],
      message: '결재 요청이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 발령 시행
  http.post('/api/v1/appointments/drafts/:id/execute', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (drafts[index].status !== 'APPROVED') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_009', message: '승인된 발령안만 시행할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    drafts[index].status = 'EXECUTED';
    drafts[index].executedAt = new Date().toISOString();
    drafts[index].updatedAt = new Date().toISOString();

    // Update all details to EXECUTED
    if (drafts[index].details) {
      drafts[index].details = drafts[index].details!.map(d => ({
        ...d,
        status: 'EXECUTED' as DetailStatus,
      }));
    }

    return HttpResponse.json({
      success: true,
      data: drafts[index],
      message: '발령이 시행되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 발령 취소
  http.post('/api/v1/appointments/drafts/:id/cancel', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as { reason: string };

    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_001', message: '발령안을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(drafts[index].status)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_010', message: '이 상태의 발령안은 취소할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!body.reason) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'APT_011', message: '취소 사유를 입력해주세요.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    drafts[index].status = 'CANCELLED';
    drafts[index].cancelledAt = new Date().toISOString();
    drafts[index].cancelReason = body.reason;
    drafts[index].updatedAt = new Date().toISOString();

    // Update all details to CANCELLED
    if (drafts[index].details) {
      drafts[index].details = drafts[index].details!.map(d => ({
        ...d,
        status: 'CANCELLED' as DetailStatus,
      }));
    }

    return HttpResponse.json({
      success: true,
      data: drafts[index],
      message: '발령안이 취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // 상태별 요약 조회
  http.get('/api/v1/appointments/drafts/summary', async () => {
    await delay(200);

    const summary: AppointmentSummary = {
      draftCount: drafts.filter(d => d.status === 'DRAFT').length,
      pendingApprovalCount: drafts.filter(d => d.status === 'PENDING_APPROVAL').length,
      approvedCount: drafts.filter(d => d.status === 'APPROVED').length,
      executedCount: drafts.filter(d => d.status === 'EXECUTED').length,
    };

    return HttpResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  }),
];
