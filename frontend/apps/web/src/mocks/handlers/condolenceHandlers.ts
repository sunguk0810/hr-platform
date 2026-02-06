import { http, HttpResponse, delay } from 'msw';
import type { CondolenceRequestListItem, CondolenceRequestStatus } from '@hr-platform/shared-types';

interface CondolencePayment {
  id: string;
  condolenceRequestId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  accountNumber?: string;
  bankName?: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
}

const mockCondolences: CondolenceRequestListItem[] = [
  {
    id: 'cond-1',
    requestNumber: 'CDL-2026-0001',
    employeeName: '김철수',
    employeeNumber: 'E2020001',
    departmentName: '개발팀',
    type: 'MARRIAGE',
    status: 'PAID',
    eventDate: '2026-01-15',
    amount: 200000,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'cond-2',
    requestNumber: 'CDL-2026-0002',
    employeeName: '이영희',
    employeeNumber: 'E2021015',
    departmentName: '인사팀',
    type: 'CHILDBIRTH',
    status: 'APPROVED',
    eventDate: '2026-01-20',
    amount: 100000,
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'cond-3',
    requestNumber: 'CDL-2026-0003',
    employeeName: '박민수',
    employeeNumber: 'E2019008',
    departmentName: '재무팀',
    type: 'DEATH_PARENT',
    status: 'PENDING',
    eventDate: '2026-02-01',
    amount: 500000,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'cond-4',
    requestNumber: 'CDL-2026-0004',
    employeeName: '최지은',
    employeeNumber: 'E2022003',
    departmentName: '마케팅팀',
    type: 'MARRIAGE',
    status: 'APPROVED',
    eventDate: '2026-02-10',
    amount: 200000,
    createdAt: '2026-02-05T14:00:00Z',
  },
  {
    id: 'cond-5',
    requestNumber: 'CDL-2026-0005',
    employeeName: '정현우',
    employeeNumber: 'E2020010',
    departmentName: '영업팀',
    type: 'CHILDBIRTH',
    status: 'APPROVED',
    eventDate: '2026-02-03',
    amount: 100000,
    createdAt: '2026-02-02T11:00:00Z',
  },
];

const mockPaymentHistory: CondolencePayment[] = [
  {
    id: 'pay-1',
    condolenceRequestId: 'CDL-2026-0001',
    amount: 200000,
    paymentDate: '2026-01-16T10:00:00Z',
    paymentMethod: 'BANK_TRANSFER',
    bankName: '국민은행',
    accountNumber: '123-456-789012',
    processedBy: 'admin-1',
    processedByName: '관리자',
    createdAt: '2026-01-16T10:00:00Z',
  },
];

export const condolenceHandlers = [
  http.get('/api/v1/condolences', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');
    const status = url.searchParams.get('status') as CondolenceRequestStatus | null;

    let filtered = [...mockCondolences];
    if (status) filtered = filtered.filter((c) => c.status === status);

    return HttpResponse.json({
      success: true,
      data: {
        content: filtered.slice(page * size, (page + 1) * size),
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

  http.get('/api/v1/condolences/policies', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', type: 'MARRIAGE', amount: 200000, leavedays: 5, description: '본인 결혼', isActive: true },
        { id: '2', type: 'CHILDBIRTH', amount: 100000, leavedays: 3, description: '자녀 출산', isActive: true },
        { id: '3', type: 'DEATH_PARENT', amount: 500000, leavedays: 5, description: '부모 사망', isActive: true },
        { id: '4', type: 'DEATH_SPOUSE', amount: 500000, leavedays: 5, description: '배우자 사망', isActive: true },
      ],
    });
  }),

  http.post('/api/v1/condolences', async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      data: { id: `cond-${Date.now()}`, requestNumber: 'CDL-2026-0006', status: 'PENDING' },
    });
  }),

  // Get single condolence request
  http.get('/api/v1/condolences/:id', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const condolence = mockCondolences.find((c) => c.id === id);

    if (!condolence) {
      return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '경조비 신청을 찾을 수 없습니다.' } }, { status: 404 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        ...condolence,
        relationToEmployee: '본인',
        description: '경조비 신청합니다.',
        attachments: [
          { id: 'att-1', fileName: '청첩장.pdf', fileSize: 1024000, uploadedAt: condolence.createdAt },
        ],
        approvedBy: condolence.status !== 'PENDING' ? '인사팀장' : undefined,
        approvedAt: condolence.status !== 'PENDING' ? '2026-01-19T10:00:00Z' : undefined,
        rejectionReason: condolence.status === 'REJECTED' ? '증빙 서류 부족' : undefined,
      },
    });
  }),

  // Update condolence request
  http.put('/api/v1/condolences/:id', async ({ params }) => {
    await delay(400);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: { id, status: 'PENDING', updatedAt: new Date().toISOString() },
    });
  }),

  // Delete condolence request
  http.delete('/api/v1/condolences/:id', async () => {
    await delay(300);
    return HttpResponse.json({ success: true });
  }),

  // Approve condolence request
  http.post('/api/v1/condolences/:id/approve', async ({ params }) => {
    await delay(400);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: { id, status: 'APPROVED', approvedAt: new Date().toISOString() },
    });
  }),

  // Reject condolence request
  http.post('/api/v1/condolences/:id/reject', async ({ params }) => {
    await delay(400);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: { id, status: 'REJECTED', rejectedAt: new Date().toISOString() },
    });
  }),

  // Cancel condolence request
  http.post('/api/v1/condolences/:id/cancel', async ({ params }) => {
    await delay(300);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: { id, status: 'CANCELLED', cancelledAt: new Date().toISOString() },
    });
  }),

  // Get payment pending list
  http.get('/api/v1/condolences/payments/pending', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');

    const pendingPayments = mockCondolences.filter((c) => c.status === 'APPROVED');
    const paged = pendingPayments.slice(page * size, (page + 1) * size);

    return HttpResponse.json({
      success: true,
      data: {
        content: paged,
        page: {
          number: page,
          size,
          totalElements: pendingPayments.length,
          totalPages: Math.ceil(pendingPayments.length / size),
          first: page === 0,
          last: page >= Math.ceil(pendingPayments.length / size) - 1,
          hasNext: page < Math.ceil(pendingPayments.length / size) - 1,
          hasPrevious: page > 0,
        },
      },
    });
  }),

  // Process single payment
  http.post('/api/v1/condolences/:id/pay', async ({ params }) => {
    await delay(500);
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: { id, status: 'PAID', paidAt: new Date().toISOString() },
    });
  }),

  // Bulk process payments
  http.post('/api/v1/condolences/payments/bulk', async ({ request }) => {
    await delay(600);
    const body = await request.json() as { condolenceIds: string[] };
    return HttpResponse.json({
      success: true,
      data: { processed: body.condolenceIds.length },
    });
  }),

  // Get payment history
  http.get('/api/v1/condolences/payments/history', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');

    const paged = mockPaymentHistory.slice(page * size, (page + 1) * size);

    return HttpResponse.json({
      success: true,
      data: {
        content: paged,
        page: {
          number: page,
          size,
          totalElements: mockPaymentHistory.length,
          totalPages: Math.ceil(mockPaymentHistory.length / size),
          first: page === 0,
          last: page >= Math.ceil(mockPaymentHistory.length / size) - 1,
          hasNext: page < Math.ceil(mockPaymentHistory.length / size) - 1,
          hasPrevious: page > 0,
        },
      },
    });
  }),
];
