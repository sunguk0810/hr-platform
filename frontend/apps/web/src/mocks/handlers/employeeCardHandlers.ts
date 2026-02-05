import { http, HttpResponse, delay } from 'msw';
import type { EmployeeCardListItem, EmployeeCardStatus } from '@hr-platform/shared-types';

const mockCards: EmployeeCardListItem[] = [
  {
    id: 'card-1',
    cardNumber: 'CARD-2024-0001',
    employeeName: '김철수',
    employeeNumber: 'E2020001',
    departmentName: '개발팀',
    status: 'ACTIVE',
    issueDate: '2024-01-15',
    expiryDate: '2027-01-14',
  },
  {
    id: 'card-2',
    cardNumber: 'CARD-2024-0002',
    employeeName: '이영희',
    employeeNumber: 'E2021015',
    departmentName: '인사팀',
    status: 'ACTIVE',
    issueDate: '2024-02-01',
    expiryDate: '2027-01-31',
  },
  {
    id: 'card-3',
    cardNumber: 'CARD-2022-0050',
    employeeName: '박민수',
    employeeNumber: 'E2019008',
    departmentName: '재무팀',
    status: 'EXPIRED',
    issueDate: '2022-03-01',
    expiryDate: '2025-02-28',
  },
  {
    id: 'card-4',
    cardNumber: 'CARD-2023-0100',
    employeeName: '최지현',
    employeeNumber: 'E2018022',
    departmentName: '영업팀',
    status: 'LOST',
    issueDate: '2023-06-15',
    expiryDate: '2026-06-14',
  },
  {
    id: 'card-5',
    cardNumber: 'CARD-2026-0001',
    employeeName: '한지우',
    employeeNumber: 'E2023045',
    departmentName: '마케팅팀',
    status: 'PENDING',
    issueDate: '2026-02-01',
    expiryDate: '2029-01-31',
  },
];

export const employeeCardHandlers = [
  http.get('/api/v1/employee-cards', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');
    const status = url.searchParams.get('status') as EmployeeCardStatus | null;

    let filtered = [...mockCards];
    if (status) filtered = filtered.filter((c) => c.status === status);

    return HttpResponse.json({
      success: true,
      data: {
        content: filtered.slice(page * size, (page + 1) * size),
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      },
    });
  }),

  http.get('/api/v1/employee-cards/my', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: {
        id: 'card-1',
        cardNumber: 'CARD-2024-0001',
        employeeId: 'e1',
        employeeName: '김철수',
        employeeNumber: 'E2020001',
        departmentName: '개발팀',
        positionName: '팀장',
        gradeName: '과장',
        photoUrl: null,
        status: 'ACTIVE',
        issueType: 'NEW',
        issueDate: '2024-01-15',
        expiryDate: '2027-01-14',
        accessLevel: 'LEVEL_2',
        rfidEnabled: true,
        qrCode: 'QR123456',
        remarks: null,
      },
    });
  }),

  http.get('/api/v1/employee-cards/:id', async ({ params }) => {
    await delay(200);
    const card = mockCards.find((c) => c.id === params.id);
    if (!card) {
      return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...card,
        employeeId: 'e1',
        positionName: '팀장',
        gradeName: '과장',
        photoUrl: null,
        issueType: 'NEW',
        accessLevel: 'LEVEL_2',
        rfidEnabled: true,
        qrCode: 'QR123456',
        remarks: null,
      },
    });
  }),

  http.get('/api/v1/employee-cards/issue-requests', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: {
        content: [
          { id: 'req-1', requestNumber: 'CIR-2026-0001', employeeName: '신입사원', employeeNumber: 'E2026001', departmentName: '개발팀', issueType: 'NEW', status: 'PENDING', createdAt: '2026-02-01T09:00:00Z' },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      },
    });
  }),

  http.post('/api/v1/employee-cards/issue-requests', async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      data: { id: `req-${Date.now()}`, requestNumber: 'CIR-2026-0002', status: 'PENDING' },
    });
  }),

  http.post('/api/v1/employee-cards/report-lost', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: { status: 'LOST' },
      message: '분실 신고가 완료되었습니다.',
    });
  }),

  // Approve issue request
  http.post('/api/v1/employee-cards/issue-requests/:id/approve', async ({ params }) => {
    await delay(300);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
      },
      message: '발급 요청이 승인되었습니다.',
    });
  }),

  // Revoke card
  http.post('/api/v1/employee-cards/:id/revoke', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const card = mockCards.find((c) => c.id === id);
    if (!card) {
      return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...card,
        status: 'REVOKED',
        revokedAt: new Date().toISOString(),
      },
      message: '카드가 폐기되었습니다.',
    });
  }),
];
