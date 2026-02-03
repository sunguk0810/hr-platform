import { TenantAwareEntity, PageRequest } from './common';

// Attendance Types
export type AttendanceStatus = 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND';

export interface AttendanceRecord extends TenantAwareEntity {
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  workingHours?: number;
  overtime?: number;
  note?: string;
}

export interface AttendanceListItem {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  workingHours?: number;
}

export interface TodayAttendance {
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  workingHours?: number;
}

export interface AttendanceSearchParams extends PageRequest {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface CheckInRequest {
  note?: string;
}

export interface CheckOutRequest {
  note?: string;
}

export interface MonthlyAttendanceSummary {
  yearMonth: string;
  totalWorkingDays: number;
  attendedDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  absentDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
}

// Leave Types
export type LeaveType = 'ANNUAL' | 'SICK' | 'SPECIAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest extends TenantAwareEntity {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvalId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
}

export interface LeaveRequestListItem {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  approverName?: string;
}

export interface LeaveBalance {
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
  expiredDays: number;
}

export interface LeaveBalanceByType {
  leaveType: LeaveType;
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveSearchParams extends PageRequest {
  employeeId?: string;
  leaveType?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface CancelLeaveRequest {
  reason: string;
}

// Overtime Types
export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OvertimeRequest extends TenantAwareEntity {
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  approvalId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
}

export interface OvertimeRequestListItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  createdAt: string;
  approverName?: string;
}

export interface OvertimeSummary {
  yearMonth: string;
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  totalHours: number;
  approvedHours: number;
}

export interface CreateOvertimeRequest {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface OvertimeSearchParams extends PageRequest {
  employeeId?: string;
  status?: OvertimeStatus;
  startDate?: string;
  endDate?: string;
}

export const OVERTIME_STATUS_LABELS: Record<OvertimeStatus, string> = {
  PENDING: '승인대기',
  APPROVED: '승인',
  REJECTED: '반려',
  CANCELLED: '취소',
};

// Leave Calendar Types
export interface LeaveCalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
}

export interface LeaveCalendarSearchParams {
  departmentId?: string;
  startDate: string;
  endDate: string;
}

// Leave Type Labels
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: '연차',
  SICK: '병가',
  SPECIAL: '특별휴가',
  HALF_DAY_AM: '반차(오전)',
  HALF_DAY_PM: '반차(오후)',
  MATERNITY: '출산휴가',
  PATERNITY: '배우자출산휴가',
  UNPAID: '무급휴가',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: '승인대기',
  APPROVED: '승인',
  REJECTED: '반려',
  CANCELLED: '취소',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  NORMAL: '정상',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  ABSENT: '결근',
  HOLIDAY: '휴일',
  WEEKEND: '주말',
};
