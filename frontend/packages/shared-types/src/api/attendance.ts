import { TenantAwareEntity, PageRequest } from './common';

// Attendance Types
export type AttendanceStatus = 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND' | 'LEAVE' | 'HALF_DAY' | 'OVERTIME';

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
export type LeaveType = 'ANNUAL' | 'SICK' | 'SPECIAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'HOURLY' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
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
  startTime?: string; // For HOURLY leave
  endTime?: string;   // For HOURLY leave
  hours?: number;     // For HOURLY leave
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
  startTime?: string; // For HOURLY leave
  endTime?: string;   // For HOURLY leave
  hours?: number;     // For HOURLY leave
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
  startTime?: string; // For HOURLY leave, e.g., "10:00"
  endTime?: string;   // For HOURLY leave, e.g., "12:00"
  hours?: number;     // For HOURLY leave, calculated hours
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
  HOURLY: '시간차 휴가',
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
  LEAVE: '휴가',
  HALF_DAY: '반차',
  OVERTIME: '초과근무',
};

// ============================================
// Work Hours Monitoring (주 52시간 모니터링)
// ============================================

export type WorkHourStatus = 'NORMAL' | 'WARNING' | 'EXCEEDED';

export interface EmployeeWorkHours {
  employeeId: string;
  employeeName: string;
  department: string;
  departmentId: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: WorkHourStatus;
  exceededHours: number;
}

export interface WorkHoursSummary {
  totalEmployees: number;
  normalCount: number;
  warningCount: number;
  exceededCount: number;
}

export interface WorkHoursStatisticsResponse {
  period: string; // "2024-W03" format
  weekStartDate: string;
  weekEndDate: string;
  employees: EmployeeWorkHours[];
  summary: WorkHoursSummary;
}

export interface WorkHoursSearchParams {
  weekPeriod?: string; // "2024-W03" format
  departmentId?: string;
  status?: WorkHourStatus;
}

export const WORK_HOUR_STATUS_LABELS: Record<WorkHourStatus, string> = {
  NORMAL: '정상',
  WARNING: '주의',
  EXCEEDED: '초과',
};

// ============================================
// Leave Approval Management (휴가 승인 관리)
// ============================================

export interface PendingLeaveRequest extends LeaveRequest {
  remainingDays: number;
  isUrgent: boolean;
}

export interface PendingLeaveSearchParams extends PageRequest {
  departmentId?: string;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
}

export interface ApproveLeaveRequest {
  comment?: string;
}

export interface RejectLeaveRequest {
  reason: string;
}

export interface BulkApproveLeaveRequest {
  leaveRequestIds: string[];
  comment?: string;
}

export interface BulkRejectLeaveRequest {
  leaveRequestIds: string[];
  reason: string;
}

export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  failedIds: string[];
  errors: { id: string; message: string }[];
}

export interface PendingLeaveSummary {
  totalPending: number;
  urgentCount: number;
  thisWeekCount: number;
}

// ============================================
// Attendance Record Update (근태 수정)
// ============================================

export interface UpdateAttendanceRecordRequest {
  checkInTime?: string;
  checkOutTime?: string;
  attendanceStatus: AttendanceStatus;
  remarks: string; // 필수 - 감사 로그용
}

export interface AttendanceRecordWithAudit extends AttendanceRecord {
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  modificationHistory?: AttendanceModificationLog[];
}

export interface AttendanceModificationLog {
  modifiedAt: string;
  modifiedBy: string;
  modifiedByName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  remarks: string;
}

// ============================================
// Hourly Leave Policy (시간차 휴가 정책)
// ============================================

export type HourlyLeaveMinUnit = 30 | 60; // 30min or 1hr

export interface HourlyLeavePolicy {
  enabled: boolean;
  minUnit: HourlyLeaveMinUnit; // Minimum time unit in minutes
  dailyMaxCount: number;       // Maximum number of hourly leaves per day (1-4)
}

export interface HourlyLeaveBalance {
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  pendingHours: number;
}
