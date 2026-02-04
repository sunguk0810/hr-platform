import { http, HttpResponse, delay } from 'msw';
import type { CommitteeListItem, CommitteeStatus } from '@hr-platform/shared-types';

const mockCommittees: CommitteeListItem[] = [
  {
    id: 'comm-1',
    code: 'LAB-MGMT',
    name: '노사협의회',
    type: 'PERMANENT',
    status: 'ACTIVE',
    memberCount: 12,
    startDate: '2020-01-01',
    endDate: null,
  },
  {
    id: 'comm-2',
    code: 'ETHICS',
    name: '윤리위원회',
    type: 'PERMANENT',
    status: 'ACTIVE',
    memberCount: 8,
    startDate: '2021-03-01',
    endDate: null,
  },
  {
    id: 'comm-3',
    code: 'AI-TF',
    name: 'AI 도입 TF',
    type: 'PROJECT',
    status: 'ACTIVE',
    memberCount: 6,
    startDate: '2025-07-01',
    endDate: '2026-06-30',
  },
  {
    id: 'comm-4',
    code: 'SAFETY',
    name: '산업안전보건위원회',
    type: 'PERMANENT',
    status: 'ACTIVE',
    memberCount: 10,
    startDate: '2019-01-01',
    endDate: null,
  },
];

export const committeeHandlers = [
  http.get('/api/v1/committees', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');
    const status = url.searchParams.get('status') as CommitteeStatus | null;

    let filtered = [...mockCommittees];
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

  http.get('/api/v1/committees/:id', async ({ params }) => {
    await delay(200);
    const committee = mockCommittees.find((c) => c.id === params.id);
    if (!committee) {
      return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: { ...committee, purpose: '위원회 목적 설명', meetingSchedule: '매월 첫째 주 수요일' },
    });
  }),

  http.get('/api/v1/committees/:id/members', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'm1', employeeId: 'e1', employeeName: '김위원장', employeeNumber: 'E2018001', departmentName: '경영지원', role: 'CHAIR', startDate: '2024-01-01', isActive: true },
        { id: 'm2', employeeId: 'e2', employeeName: '이간사', employeeNumber: 'E2020005', departmentName: '인사팀', role: 'SECRETARY', startDate: '2024-01-01', isActive: true },
      ],
    });
  }),

  http.post('/api/v1/committees', async () => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      data: { id: `comm-${Date.now()}`, code: 'NEW-COMM', name: '새 위원회', status: 'ACTIVE' },
    });
  }),
];
