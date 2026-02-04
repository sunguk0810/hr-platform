import { http, HttpResponse, delay } from 'msw';
import { format, subDays, startOfMonth, eachDayOfInterval, isWeekend, startOfWeek, endOfWeek, getISOWeek, getYear } from 'date-fns';
import type {
  AttendanceRecord,
  TodayAttendance,
  MonthlyAttendanceSummary,
  LeaveRequest,
  LeaveBalance,
  LeaveBalanceByType,
  AttendanceStatus,
  LeaveStatus,
  LeaveType,
  EmployeeWorkHours,
  WorkHourStatus,
  PendingLeaveRequest,
} from '@hr-platform/shared-types';

// Generate mock attendance records for the current month
function generateMockAttendanceRecords(): AttendanceRecord[] {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const records: AttendanceRecord[] = [];

  const days = eachDayOfInterval({ start: monthStart, end: today });

  days.forEach((day, index) => {
    if (isWeekend(day)) {
      records.push({
        id: `att-${index}`,
        tenantId: 'tenant-001',
        employeeId: 'emp-001',
        employeeName: '홍길동',
        date: format(day, 'yyyy-MM-dd'),
        status: 'WEEKEND' as AttendanceStatus,
        createdAt: day.toISOString(),
        updatedAt: day.toISOString(),
      });
    } else {
      // Random status for demonstration
      const statuses: AttendanceStatus[] = ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'LATE', 'EARLY_LEAVE'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const checkInHour = status === 'LATE' ? 9 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 60) / 60;
      const checkOutHour = status === 'EARLY_LEAVE' ? 16 + Math.random() : 18 + Math.random() * 2;
      const workingHours = Math.round((checkOutHour - checkInHour) * 10) / 10;

      records.push({
        id: `att-${index}`,
        tenantId: 'tenant-001',
        employeeId: 'emp-001',
        employeeName: '홍길동',
        date: format(day, 'yyyy-MM-dd'),
        checkInTime: `${String(Math.floor(checkInHour)).padStart(2, '0')}:${String(Math.floor((checkInHour % 1) * 60)).padStart(2, '0')}:00`,
        checkOutTime: `${String(Math.floor(checkOutHour)).padStart(2, '0')}:${String(Math.floor((checkOutHour % 1) * 60)).padStart(2, '0')}:00`,
        status,
        workingHours,
        overtime: workingHours > 8 ? Math.round((workingHours - 8) * 10) / 10 : 0,
        createdAt: day.toISOString(),
        updatedAt: day.toISOString(),
      });
    }
  });

  return records;
}

let mockAttendanceRecords = generateMockAttendanceRecords();

// Mock leave calendar events
const mockLeaveCalendarEvents = [
  {
    id: 'lc-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    departmentName: '개발팀',
    leaveType: 'ANNUAL' as LeaveType,
    startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    days: 2,
    status: 'APPROVED' as LeaveStatus,
  },
  {
    id: 'lc-002',
    employeeId: 'emp-002',
    employeeName: '김철수',
    departmentName: '개발팀',
    leaveType: 'SICK' as LeaveType,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    days: 1,
    status: 'APPROVED' as LeaveStatus,
  },
  {
    id: 'lc-003',
    employeeId: 'emp-003',
    employeeName: '이영희',
    departmentName: '인사팀',
    leaveType: 'ANNUAL' as LeaveType,
    startDate: format(subDays(new Date(), -3), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -5), 'yyyy-MM-dd'),
    days: 3,
    status: 'APPROVED' as LeaveStatus,
  },
  {
    id: 'lc-004',
    employeeId: 'emp-005',
    employeeName: '최수진',
    departmentName: '마케팅팀',
    leaveType: 'HALF_DAY_AM' as LeaveType,
    startDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'),
    days: 0.5,
    status: 'APPROVED' as LeaveStatus,
  },
];

// Mock overtime requests
interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

const mockOvertimeRequests: OvertimeRequest[] = [
  {
    id: 'ot-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '21:00',
    hours: 3,
    reason: '프로젝트 마감',
    status: 'APPROVED',
    createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
  },
  {
    id: 'ot-002',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '20:00',
    hours: 2,
    reason: '긴급 버그 수정',
    status: 'PENDING',
    createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
  },
  {
    id: 'ot-003',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '22:00',
    hours: 4,
    reason: '배포 작업',
    status: 'APPROVED',
    createdAt: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
  },
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-001',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    leaveType: 'ANNUAL',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 28), 'yyyy-MM-dd'),
    days: 3,
    reason: '개인 사유',
    status: 'APPROVED',
    approverName: '이영희',
    approvedAt: format(subDays(new Date(), 32), 'yyyy-MM-dd'),
    createdAt: format(subDays(new Date(), 35), 'yyyy-MM-dd'),
    updatedAt: format(subDays(new Date(), 32), 'yyyy-MM-dd'),
  },
  {
    id: 'leave-002',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    leaveType: 'HALF_DAY_AM',
    startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    days: 0.5,
    reason: '병원 진료',
    status: 'APPROVED',
    approverName: '이영희',
    approvedAt: format(subDays(new Date(), 16), 'yyyy-MM-dd'),
    createdAt: format(subDays(new Date(), 17), 'yyyy-MM-dd'),
    updatedAt: format(subDays(new Date(), 16), 'yyyy-MM-dd'),
  },
  {
    id: 'leave-003',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    leaveType: 'ANNUAL',
    startDate: format(subDays(new Date(), -7), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), -9), 'yyyy-MM-dd'),
    days: 3,
    reason: '가족 여행',
    status: 'PENDING',
    createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
    updatedAt: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
  },
  {
    id: 'leave-004',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    leaveType: 'SICK',
    startDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    days: 1,
    reason: '감기',
    status: 'APPROVED',
    approverName: '이영희',
    approvedAt: format(subDays(new Date(), 61), 'yyyy-MM-dd'),
    createdAt: format(subDays(new Date(), 62), 'yyyy-MM-dd'),
    updatedAt: format(subDays(new Date(), 61), 'yyyy-MM-dd'),
  },
  {
    id: 'leave-005',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    leaveType: 'HALF_DAY_PM',
    startDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    days: 0.5,
    reason: '개인 사유',
    status: 'REJECTED',
    rejectReason: '업무 일정상 불가',
    approverName: '이영희',
    createdAt: format(subDays(new Date(), 48), 'yyyy-MM-dd'),
    updatedAt: format(subDays(new Date(), 47), 'yyyy-MM-dd'),
  },
];

let todayCheckedIn = false;
let todayCheckedOut = false;
let todayCheckInTime: string | undefined;
let todayCheckOutTime: string | undefined;

export const attendanceHandlers = [
  // Get today's attendance
  http.get('/api/v1/attendance/today', async () => {
    await delay(200);

    const today: TodayAttendance = {
      date: format(new Date(), 'yyyy-MM-dd'),
      checkInTime: todayCheckInTime,
      checkOutTime: todayCheckOutTime,
      status: todayCheckedIn ? (todayCheckedOut ? 'NORMAL' : 'NORMAL') : 'ABSENT',
      workingHours: todayCheckInTime && todayCheckOutTime ? 8 : undefined,
    };

    return HttpResponse.json({
      success: true,
      data: today,
      timestamp: new Date().toISOString(),
    });
  }),

  // Check in
  http.post('/api/v1/attendance/check-in', async () => {
    await delay(300);

    if (todayCheckedIn) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_001', message: '이미 출근 처리되었습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    todayCheckedIn = true;
    todayCheckInTime = format(new Date(), 'HH:mm:ss');

    return HttpResponse.json({
      success: true,
      data: { checkInTime: todayCheckInTime },
      message: '출근 처리되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Check out
  http.post('/api/v1/attendance/check-out', async () => {
    await delay(300);

    if (!todayCheckedIn) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_002', message: '출근 기록이 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (todayCheckedOut) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_003', message: '이미 퇴근 처리되었습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    todayCheckedOut = true;
    todayCheckOutTime = format(new Date(), 'HH:mm:ss');

    return HttpResponse.json({
      success: true,
      data: { checkOutTime: todayCheckOutTime },
      message: '퇴근 처리되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get attendance records
  http.get('/api/v1/attendance/records', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const status = url.searchParams.get('status') as AttendanceStatus | null;

    let filtered = [...mockAttendanceRecords];

    if (startDate) {
      filtered = filtered.filter(r => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(r => r.date <= endDate);
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date));

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Get monthly summary
  http.get('/api/v1/attendance/summary/:yearMonth', async ({ params }) => {
    await delay(200);

    const { yearMonth } = params;
    const records = mockAttendanceRecords.filter(r => r.date.startsWith(yearMonth as string));

    const workingRecords = records.filter(r => !['WEEKEND', 'HOLIDAY'].includes(r.status));
    const summary: MonthlyAttendanceSummary = {
      yearMonth: yearMonth as string,
      totalWorkingDays: workingRecords.length,
      attendedDays: workingRecords.filter(r => r.checkInTime).length,
      lateDays: workingRecords.filter(r => r.status === 'LATE').length,
      earlyLeaveDays: workingRecords.filter(r => r.status === 'EARLY_LEAVE').length,
      absentDays: workingRecords.filter(r => r.status === 'ABSENT').length,
      totalWorkingHours: workingRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0),
      totalOvertimeHours: workingRecords.reduce((sum, r) => sum + (r.overtime || 0), 0),
    };

    return HttpResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get leave balance
  http.get('/api/v1/leaves/balance', async () => {
    await delay(200);

    const usedDays = mockLeaveRequests
      .filter(l => l.status === 'APPROVED')
      .reduce((sum, l) => sum + l.days, 0);
    const pendingDays = mockLeaveRequests
      .filter(l => l.status === 'PENDING')
      .reduce((sum, l) => sum + l.days, 0);

    const balance: LeaveBalance = {
      year: new Date().getFullYear(),
      totalDays: 15,
      usedDays,
      remainingDays: 15 - usedDays,
      pendingDays,
      expiredDays: 0,
    };

    return HttpResponse.json({
      success: true,
      data: balance,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get leave balance by type
  http.get('/api/v1/leaves/balance/by-type', async () => {
    await delay(200);

    const balanceByType: LeaveBalanceByType[] = [
      { leaveType: 'ANNUAL', leaveTypeName: '연차', totalDays: 15, usedDays: 7, remainingDays: 8 },
      { leaveType: 'SICK', leaveTypeName: '병가', totalDays: 3, usedDays: 1, remainingDays: 2 },
      { leaveType: 'SPECIAL', leaveTypeName: '특별휴가', totalDays: 5, usedDays: 0, remainingDays: 5 },
    ];

    return HttpResponse.json({
      success: true,
      data: balanceByType,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get leave requests
  http.get('/api/v1/leaves', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as LeaveStatus | null;
    const leaveType = url.searchParams.get('leaveType') as LeaveType | null;

    let filtered = [...mockLeaveRequests];

    if (status) {
      filtered = filtered.filter(l => l.status === status);
    }
    if (leaveType) {
      filtered = filtered.filter(l => l.leaveType === leaveType);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Create leave request
  http.post('/api/v1/leaves', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const startDate = new Date(body.startDate as string);
    const endDate = new Date(body.endDate as string);
    const days = (body.leaveType as string).startsWith('HALF_DAY')
      ? 0.5
      : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      tenantId: 'tenant-001',
      employeeId: 'emp-001',
      employeeName: '홍길동',
      leaveType: body.leaveType as LeaveType,
      startDate: body.startDate as string,
      endDate: body.endDate as string,
      days,
      reason: body.reason as string,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockLeaveRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
      message: '휴가 신청이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Cancel leave request
  http.post('/api/v1/leaves/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockLeaveRequests.findIndex(l => l.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_001', message: '휴가 신청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (mockLeaveRequests[index].status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_002', message: '대기 중인 휴가만 취소할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockLeaveRequests[index].status = 'CANCELLED';
    mockLeaveRequests[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: mockLeaveRequests[index],
      message: '휴가 신청이 취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Leave Calendar
  http.get('/api/v1/leaves/calendar', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const departmentId = url.searchParams.get('departmentId');

    let filtered = [...mockLeaveCalendarEvents];

    if (startDate && endDate) {
      filtered = filtered.filter(event => {
        return event.startDate <= endDate && event.endDate >= startDate;
      });
    }

    if (departmentId) {
      // In real app, filter by department
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  }),

  // Overtime list
  http.get('/api/v1/overtime', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status');

    let filtered = [...mockOvertimeRequests];

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Overtime summary
  http.get('/api/v1/overtime/summary/:yearMonth', async ({ params }) => {
    await delay(200);

    const { yearMonth } = params;
    const monthRequests = mockOvertimeRequests.filter(o => o.date.startsWith(yearMonth as string));

    const summary = {
      yearMonth: yearMonth as string,
      totalRequests: monthRequests.length,
      approvedRequests: monthRequests.filter(o => o.status === 'APPROVED').length,
      pendingRequests: monthRequests.filter(o => o.status === 'PENDING').length,
      totalHours: monthRequests.reduce((sum, o) => sum + o.hours, 0),
      approvedHours: monthRequests.filter(o => o.status === 'APPROVED').reduce((sum, o) => sum + o.hours, 0),
    };

    return HttpResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create overtime request
  http.post('/api/v1/overtime', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const startTime = body.startTime as string;
    const endTime = body.endTime as string;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = Math.max(0, (endH * 60 + endM - startH * 60 - startM) / 60);

    const newRequest: OvertimeRequest = {
      id: `ot-${Date.now()}`,
      employeeId: 'emp-001',
      employeeName: '홍길동',
      date: body.date as string,
      startTime,
      endTime,
      hours,
      reason: body.reason as string,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    mockOvertimeRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
      message: '초과근무 신청이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Cancel overtime request
  http.post('/api/v1/overtime/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockOvertimeRequests.findIndex(o => o.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'OT_001', message: '초과근무 신청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (mockOvertimeRequests[index].status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'OT_002', message: '대기 중인 신청만 취소할 수 있습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockOvertimeRequests[index].status = 'CANCELLED';

    return HttpResponse.json({
      success: true,
      data: mockOvertimeRequests[index],
      message: '초과근무 신청이 취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // ============================================
  // Work Hours Monitoring (주 52시간 모니터링)
  // ============================================

  http.get('/api/v1/attendance/statistics/work-hours', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const weekPeriod = url.searchParams.get('weekPeriod');
    const departmentId = url.searchParams.get('departmentId');
    const status = url.searchParams.get('status') as WorkHourStatus | null;

    // Parse week period or use current week
    let weekStart: Date;
    let weekEnd: Date;
    let period: string;

    if (weekPeriod) {
      const [year, week] = weekPeriod.split('-W').map(Number);
      // Calculate the start of the specified ISO week
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      period = weekPeriod;
    } else {
      const now = new Date();
      weekStart = startOfWeek(now, { weekStartsOn: 1 });
      weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      period = `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
    }

    // Generate mock employee work hours data
    const mockEmployees: EmployeeWorkHours[] = [
      { employeeId: 'emp-001', employeeName: '홍길동', department: '개발팀', departmentId: 'dept-001', regularHours: 40, overtimeHours: 15, totalHours: 55, status: 'EXCEEDED', exceededHours: 3 },
      { employeeId: 'emp-002', employeeName: '김철수', department: '개발팀', departmentId: 'dept-001', regularHours: 40, overtimeHours: 10, totalHours: 50, status: 'WARNING', exceededHours: 0 },
      { employeeId: 'emp-003', employeeName: '이영희', department: '인사팀', departmentId: 'dept-002', regularHours: 40, overtimeHours: 5, totalHours: 45, status: 'NORMAL', exceededHours: 0 },
      { employeeId: 'emp-004', employeeName: '박민수', department: '마케팅팀', departmentId: 'dept-003', regularHours: 40, overtimeHours: 12, totalHours: 52, status: 'WARNING', exceededHours: 0 },
      { employeeId: 'emp-005', employeeName: '최수진', department: '영업팀', departmentId: 'dept-004', regularHours: 40, overtimeHours: 18, totalHours: 58, status: 'EXCEEDED', exceededHours: 6 },
      { employeeId: 'emp-006', employeeName: '정대현', department: '재무팀', departmentId: 'dept-005', regularHours: 40, overtimeHours: 3, totalHours: 43, status: 'NORMAL', exceededHours: 0 },
      { employeeId: 'emp-007', employeeName: '강민지', department: '개발팀', departmentId: 'dept-001', regularHours: 40, overtimeHours: 8, totalHours: 48, status: 'WARNING', exceededHours: 0 },
      { employeeId: 'emp-008', employeeName: '윤서영', department: '인사팀', departmentId: 'dept-002', regularHours: 40, overtimeHours: 2, totalHours: 42, status: 'NORMAL', exceededHours: 0 },
      { employeeId: 'emp-009', employeeName: '조현우', department: '개발팀', departmentId: 'dept-001', regularHours: 40, overtimeHours: 14, totalHours: 54, status: 'EXCEEDED', exceededHours: 2 },
      { employeeId: 'emp-010', employeeName: '한지민', department: '마케팅팀', departmentId: 'dept-003', regularHours: 40, overtimeHours: 6, totalHours: 46, status: 'NORMAL', exceededHours: 0 },
    ];

    let filtered = [...mockEmployees];

    if (departmentId) {
      filtered = filtered.filter(e => e.departmentId === departmentId);
    }
    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }

    const summary = {
      totalEmployees: filtered.length,
      normalCount: filtered.filter(e => e.status === 'NORMAL').length,
      warningCount: filtered.filter(e => e.status === 'WARNING').length,
      exceededCount: filtered.filter(e => e.status === 'EXCEEDED').length,
    };

    return HttpResponse.json({
      success: true,
      data: {
        period,
        weekStartDate: format(weekStart, 'yyyy-MM-dd'),
        weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
        employees: filtered,
        summary,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // ============================================
  // Leave Approval Management (휴가 승인 관리)
  // ============================================

  // Get pending leave requests
  http.get('/api/v1/leaves/pending', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const leaveType = url.searchParams.get('leaveType') as LeaveType | null;

    // Generate mock pending leave requests
    const mockPendingRequests: PendingLeaveRequest[] = [
      {
        id: 'pending-001',
        tenantId: 'tenant-001',
        employeeId: 'emp-002',
        employeeName: '김철수',
        leaveType: 'ANNUAL',
        startDate: format(subDays(new Date(), -3), 'yyyy-MM-dd'),
        endDate: format(subDays(new Date(), -5), 'yyyy-MM-dd'),
        days: 3,
        reason: '가족 여행',
        status: 'PENDING',
        remainingDays: 10,
        isUrgent: false,
        createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
        updatedAt: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
      },
      {
        id: 'pending-002',
        tenantId: 'tenant-001',
        employeeId: 'emp-003',
        employeeName: '이영희',
        leaveType: 'SICK',
        startDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'),
        endDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'),
        days: 1,
        reason: '병원 진료',
        status: 'PENDING',
        remainingDays: 3,
        isUrgent: true,
        createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      },
      {
        id: 'pending-003',
        tenantId: 'tenant-001',
        employeeId: 'emp-004',
        employeeName: '박민수',
        leaveType: 'HALF_DAY_AM',
        startDate: format(subDays(new Date(), -2), 'yyyy-MM-dd'),
        endDate: format(subDays(new Date(), -2), 'yyyy-MM-dd'),
        days: 0.5,
        reason: '개인 사유',
        status: 'PENDING',
        remainingDays: 8,
        isUrgent: false,
        createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
        updatedAt: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      },
      {
        id: 'pending-004',
        tenantId: 'tenant-001',
        employeeId: 'emp-005',
        employeeName: '최수진',
        leaveType: 'ANNUAL',
        startDate: format(subDays(new Date(), -7), 'yyyy-MM-dd'),
        endDate: format(subDays(new Date(), -10), 'yyyy-MM-dd'),
        days: 4,
        reason: '휴양',
        status: 'PENDING',
        remainingDays: 5,
        isUrgent: false,
        createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
        updatedAt: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      },
      {
        id: 'pending-005',
        tenantId: 'tenant-001',
        employeeId: 'emp-007',
        employeeName: '강민지',
        leaveType: 'SPECIAL',
        startDate: format(subDays(new Date(), -5), 'yyyy-MM-dd'),
        endDate: format(subDays(new Date(), -5), 'yyyy-MM-dd'),
        days: 1,
        reason: '경조사',
        status: 'PENDING',
        remainingDays: 5,
        isUrgent: true,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        updatedAt: format(new Date(), 'yyyy-MM-dd'),
      },
    ];

    let filtered = [...mockPendingRequests];

    if (leaveType) {
      filtered = filtered.filter(l => l.leaveType === leaveType);
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Get pending leave summary
  http.get('/api/v1/leaves/pending/summary', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: {
        totalPending: 5,
        urgentCount: 2,
        thisWeekCount: 3,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get leave request detail
  http.get('/api/v1/leaves/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const request = mockLeaveRequests.find(l => l.id === id);

    if (!request) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_001', message: '휴가 신청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        ...request,
        remainingDays: 10,
        isUrgent: false,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Approve leave request
  http.post('/api/v1/leaves/:id/approve', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockLeaveRequests.findIndex(l => l.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_001', message: '휴가 신청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockLeaveRequests[index] = {
      ...mockLeaveRequests[index],
      status: 'APPROVED',
      approverName: '관리자',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockLeaveRequests[index],
      message: '휴가가 승인되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Reject leave request
  http.post('/api/v1/leaves/:id/reject', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as { reason: string };
    const index = mockLeaveRequests.findIndex(l => l.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_001', message: '휴가 신청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!body.reason) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_003', message: '반려 사유를 입력해주세요.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockLeaveRequests[index] = {
      ...mockLeaveRequests[index],
      status: 'REJECTED',
      rejectReason: body.reason,
      approverName: '관리자',
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockLeaveRequests[index],
      message: '휴가가 반려되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Bulk approve leave requests
  http.post('/api/v1/leaves/bulk-approve', async ({ request }) => {
    await delay(500);

    const body = await request.json() as { leaveRequestIds: string[]; comment?: string };
    const { leaveRequestIds } = body;

    let successCount = 0;
    const failedIds: string[] = [];
    const errors: { id: string; message: string }[] = [];

    leaveRequestIds.forEach(id => {
      const index = mockLeaveRequests.findIndex(l => l.id === id);
      if (index !== -1 && mockLeaveRequests[index].status === 'PENDING') {
        mockLeaveRequests[index] = {
          ...mockLeaveRequests[index],
          status: 'APPROVED',
          approverName: '관리자',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        successCount++;
      } else {
        failedIds.push(id);
        errors.push({ id, message: '처리할 수 없는 상태입니다.' });
      }
    });

    return HttpResponse.json({
      success: true,
      data: {
        successCount,
        failedCount: failedIds.length,
        failedIds,
        errors,
      },
      message: `${successCount}건이 승인되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }),

  // Bulk reject leave requests
  http.post('/api/v1/leaves/bulk-reject', async ({ request }) => {
    await delay(500);

    const body = await request.json() as { leaveRequestIds: string[]; reason: string };
    const { leaveRequestIds, reason } = body;

    if (!reason) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'LEV_003', message: '반려 사유를 입력해주세요.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let successCount = 0;
    const failedIds: string[] = [];
    const errors: { id: string; message: string }[] = [];

    leaveRequestIds.forEach(id => {
      const index = mockLeaveRequests.findIndex(l => l.id === id);
      if (index !== -1 && mockLeaveRequests[index].status === 'PENDING') {
        mockLeaveRequests[index] = {
          ...mockLeaveRequests[index],
          status: 'REJECTED',
          rejectReason: reason,
          approverName: '관리자',
          updatedAt: new Date().toISOString(),
        };
        successCount++;
      } else {
        failedIds.push(id);
        errors.push({ id, message: '처리할 수 없는 상태입니다.' });
      }
    });

    return HttpResponse.json({
      success: true,
      data: {
        successCount,
        failedCount: failedIds.length,
        failedIds,
        errors,
      },
      message: `${successCount}건이 반려되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }),

  // ============================================
  // Attendance Record Update (근태 수정)
  // ============================================

  // Get attendance record detail
  http.get('/api/v1/attendance/records/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const record = mockAttendanceRecords.find(r => r.id === id);

    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_004', message: '근태 기록을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        ...record,
        lastModifiedBy: null,
        lastModifiedAt: null,
        modificationHistory: [],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Update attendance record
  http.put('/api/v1/attendance/records/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as {
      checkInTime?: string;
      checkOutTime?: string;
      attendanceStatus: AttendanceStatus;
      remarks: string;
    };

    const index = mockAttendanceRecords.findIndex(r => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_004', message: '근태 기록을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!body.remarks) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ATT_005', message: '수정 사유를 입력해주세요.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Calculate working hours if both check-in and check-out times are provided
    let workingHours = mockAttendanceRecords[index].workingHours;
    if (body.checkInTime && body.checkOutTime) {
      const [inH, inM] = body.checkInTime.split(':').map(Number);
      const [outH, outM] = body.checkOutTime.split(':').map(Number);
      workingHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;
    }

    mockAttendanceRecords[index] = {
      ...mockAttendanceRecords[index],
      checkInTime: body.checkInTime || mockAttendanceRecords[index].checkInTime,
      checkOutTime: body.checkOutTime || mockAttendanceRecords[index].checkOutTime,
      status: body.attendanceStatus,
      workingHours,
      note: body.remarks,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockAttendanceRecords[index],
      message: '근태 기록이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
