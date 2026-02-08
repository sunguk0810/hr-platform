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
    exOfficioCount: 3,
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
    exOfficioCount: 2,
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
    exOfficioCount: 0,
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
    exOfficioCount: 4,
    startDate: '2019-01-01',
    endDate: null,
  },
];

export const committeeHandlers = [
  // Backend returns List (array), not Page - hook handles client-side pagination
  http.get('/api/v1/committees', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as CommitteeStatus | null;

    let filtered = [...mockCommittees];
    if (status) filtered = filtered.filter((c) => c.status === status);

    // Return array directly - hook handles pagination client-side
    return HttpResponse.json({
      success: true,
      data: filtered,
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
        { id: 'm1', employeeId: 'e1', employeeName: '김위원장', employeeNumber: 'E2018001', departmentName: '경영지원', role: 'CHAIR', joinDate: '2024-01-01', leaveDate: null, isActive: true, isExOfficio: true, exOfficioRole: '경영지원본부장' },
        { id: 'm2', employeeId: 'e2', employeeName: '이간사', employeeNumber: 'E2020005', departmentName: '인사팀', role: 'SECRETARY', joinDate: '2024-01-01', leaveDate: null, isActive: true, isExOfficio: true, exOfficioRole: '인사팀장' },
        { id: 'm3', employeeId: 'e3', employeeName: '박위원', employeeNumber: 'E2019012', departmentName: '재무팀', role: 'MEMBER', joinDate: '2024-01-01', leaveDate: null, isActive: true, isExOfficio: false },
        { id: 'm4', employeeId: 'e4', employeeName: '최위원', employeeNumber: 'E2021003', departmentName: '법무팀', role: 'MEMBER', joinDate: '2024-06-01', leaveDate: null, isActive: true, isExOfficio: false },
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
