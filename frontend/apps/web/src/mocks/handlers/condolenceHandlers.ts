import { http, HttpResponse, delay } from 'msw';
import type { CondolenceRequestListItem, CondolenceRequestStatus, CondolenceType } from '@hr-platform/shared-types';

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
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
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
      data: { id: `cond-${Date.now()}`, requestNumber: 'CDL-2026-0004', status: 'PENDING' },
    });
  }),
];
