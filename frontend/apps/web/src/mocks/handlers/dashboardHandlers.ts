import { http, HttpResponse, delay } from 'msw';

// Shared attendance state for dashboard and attendance features
let attendanceState = {
  status: 'NOT_CHECKED_IN' as 'NOT_CHECKED_IN' | 'WORKING' | 'CHECKED_OUT',
  checkInTime: null as string | null,
  checkOutTime: null as string | null,
};

// Helper function to calculate work duration
function calculateWorkDuration(): string {
  if (!attendanceState.checkInTime) return '0분';

  const checkIn = new Date(attendanceState.checkInTime);
  const now = attendanceState.checkOutTime
    ? new Date(attendanceState.checkOutTime)
    : new Date();

  const diffMs = now.getTime() - checkIn.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}시간 ${diffMinutes}분`;
  }
  return `${diffMinutes}분`;
}

// Export for use in attendance handlers
export { attendanceState, calculateWorkDuration };

export const dashboardHandlers = [
  // Get attendance status
  http.get('/api/v1/dashboard/attendance', async () => {
    await delay(400);

    return HttpResponse.json({
      success: true,
      data: {
        status: attendanceState.status,
        checkInTime: attendanceState.checkInTime,
        checkOutTime: attendanceState.checkOutTime,
        workDuration: calculateWorkDuration(),
        scheduledWorkHours: 8,
        overtimeHours: 0,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Check in
  http.post('/api/v1/attendances/check-in', async () => {
    await delay(300);

    attendanceState.status = 'WORKING';
    attendanceState.checkInTime = new Date().toISOString();
    attendanceState.checkOutTime = null;

    return HttpResponse.json({
      success: true,
      data: {
        id: 'att-001',
        checkInTime: attendanceState.checkInTime,
        status: 'WORKING',
      },
      message: '출근이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Check out
  http.post('/api/v1/attendances/check-out', async () => {
    await delay(300);

    attendanceState.status = 'CHECKED_OUT';
    attendanceState.checkOutTime = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: {
        id: 'att-001',
        checkInTime: attendanceState.checkInTime,
        checkOutTime: attendanceState.checkOutTime,
        status: 'CHECKED_OUT',
        workDuration: calculateWorkDuration(),
      },
      message: '퇴근이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get leave balance
  http.get('/api/v1/dashboard/leave-balance', async () => {
    await delay(350);

    return HttpResponse.json({
      success: true,
      data: {
        annual: {
          total: 15,
          used: 7,
          remaining: 8,
        },
        sick: {
          total: 3,
          used: 1,
          remaining: 2,
        },
        special: {
          total: 5,
          used: 2,
          remaining: 3,
        },
        upcoming: [
          {
            id: 'leave-001',
            type: 'ANNUAL',
            startDate: '2024-03-20',
            endDate: '2024-03-22',
            days: 3,
            status: 'APPROVED',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get pending approvals
  http.get('/api/v1/dashboard/pending-approvals', async () => {
    await delay(400);

    return HttpResponse.json({
      success: true,
      data: {
        total: 5,
        items: [
          {
            id: 'appr-001',
            type: 'LEAVE_REQUEST',
            title: '연차 휴가 신청',
            requester: '김철수',
            requestDate: '2024-03-14T10:30:00',
            urgency: 'NORMAL',
          },
          {
            id: 'appr-002',
            type: 'EXPENSE',
            title: '출장비 정산',
            requester: '이영희',
            requestDate: '2024-03-14T09:15:00',
            urgency: 'HIGH',
          },
          {
            id: 'appr-003',
            type: 'OVERTIME',
            title: '연장근무 신청',
            requester: '박지민',
            requestDate: '2024-03-13T17:00:00',
            urgency: 'LOW',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get dashboard widgets configuration
  http.get('/api/v1/dashboard/widgets', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: {
        widgets: [
          { id: 'attendance', order: 1, visible: true },
          { id: 'leave-balance', order: 2, visible: true },
          { id: 'pending-approvals', order: 3, visible: true },
          { id: 'team-leave', order: 4, visible: true },
          { id: 'announcements', order: 5, visible: true },
          { id: 'org-summary', order: 6, visible: true },
          { id: 'statistics', order: 7, visible: true },
          { id: 'birthdays', order: 8, visible: true },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get organization summary (admin/HR only)
  http.get('/api/v1/dashboard/org-summary', async () => {
    await delay(350);

    return HttpResponse.json({
      success: true,
      data: {
        totalEmployees: 1247,
        activeEmployees: 1198,
        onLeaveEmployees: 12,
        departmentCount: 45,
        positionCount: 18,
        newHiresThisMonth: 8,
        resignedThisMonth: 3,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get statistics (admin only)
  http.get('/api/v1/dashboard/statistics', async () => {
    await delay(400);

    return HttpResponse.json({
      success: true,
      data: {
        attendanceRate: {
          label: '출근율',
          value: 96.5,
          previousValue: 94.2,
          format: 'percent',
        },
        leaveUsageRate: {
          label: '휴가 사용률',
          value: 68.3,
          previousValue: 62.1,
          format: 'percent',
        },
        overtimeHours: {
          label: '초과 근무',
          value: 12.5,
          previousValue: 15.8,
          unit: 'hours',
          format: 'hours',
        },
        approvalProcessingTime: {
          label: '결재 처리 시간',
          value: 4.2,
          previousValue: 5.1,
          unit: 'hours',
          format: 'hours',
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get announcements
  http.get('/api/v1/dashboard/announcements', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: {
        announcements: [
          {
            id: 'ann-001',
            title: '2024년 상반기 성과 평가 안내',
            category: 'NOTICE',
            isPinned: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            author: {
              name: '인사팀',
              department: '인사부',
            },
          },
          {
            id: 'ann-002',
            title: '사내 체육대회 참가 신청 (3/25 ~ 4/5)',
            category: 'EVENT',
            isPinned: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            author: {
              name: '총무팀',
              department: '경영지원부',
            },
          },
          {
            id: 'ann-003',
            title: '근태관리 시스템 업데이트 안내',
            category: 'UPDATE',
            isPinned: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            author: {
              name: 'IT팀',
              department: 'IT부',
            },
          },
          {
            id: 'ann-004',
            title: '긴급: 3/20(수) 오후 시스템 점검 안내',
            category: 'URGENT',
            isPinned: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            author: {
              name: 'IT팀',
              department: 'IT부',
            },
          },
        ],
        totalCount: 12,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get birthdays
  http.get('/api/v1/dashboard/birthdays', async () => {
    await delay(250);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return HttpResponse.json({
      success: true,
      data: {
        today: [
          {
            id: 'emp-101',
            name: '김영희',
            nameEn: 'Younghee Kim',
            profileImageUrl: null,
            department: '마케팅팀',
            position: '대리',
            birthDate: `1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
          },
        ],
        upcoming: [
          {
            id: 'emp-102',
            name: '이철수',
            nameEn: 'Cheolsu Lee',
            profileImageUrl: null,
            department: '개발팀',
            position: '과장',
            birthDate: `1988-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`,
          },
          {
            id: 'emp-103',
            name: '박지민',
            nameEn: 'Jimin Park',
            profileImageUrl: null,
            department: '인사팀',
            position: '사원',
            birthDate: `1995-${String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dayAfterTomorrow.getDate()).padStart(2, '0')}`,
          },
          {
            id: 'emp-104',
            name: '최수진',
            nameEn: 'Sujin Choi',
            profileImageUrl: null,
            department: '영업팀',
            position: '대리',
            birthDate: `1992-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`,
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get team leave
  http.get('/api/v1/dashboard/team-leave', async () => {
    await delay(300);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    return HttpResponse.json({
      success: true,
      data: {
        leaves: [
          {
            id: 'leave-t01',
            employeeId: 'emp-002',
            employeeName: '김철수',
            departmentName: '개발팀',
            leaveType: '연차',
            startDate: todayStr,
            endDate: todayStr,
            profileImageUrl: null,
          },
          {
            id: 'leave-t02',
            employeeId: 'emp-003',
            employeeName: '이영희',
            departmentName: '인사팀',
            leaveType: '반차(오후)',
            startDate: todayStr,
            endDate: todayStr,
            profileImageUrl: null,
          },
          {
            id: 'leave-t03',
            employeeId: 'emp-005',
            employeeName: '최수진',
            departmentName: '마케팅팀',
            leaveType: '연차',
            startDate: tomorrowStr,
            endDate: dayAfterStr,
            profileImageUrl: null,
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
