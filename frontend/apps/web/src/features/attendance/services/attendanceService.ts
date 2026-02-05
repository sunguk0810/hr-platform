import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  AttendanceRecord,
  TodayAttendance,
  MonthlyAttendanceSummary,
  AttendanceSearchParams,
  CheckInRequest,
  CheckOutRequest,
  LeaveRequest,
  LeaveBalance,
  LeaveBalanceByType,
  LeaveSearchParams,
  CreateLeaveRequest,
  LeaveCalendarEvent,
  LeaveCalendarSearchParams,
  OvertimeRequest,
  OvertimeRequestListItem,
  OvertimeSummary,
  OvertimeSearchParams,
  CreateOvertimeRequest,
  // Work Hours Monitoring
  WorkHoursStatisticsResponse,
  WorkHoursSearchParams,
  // Leave Approval
  PendingLeaveRequest,
  PendingLeaveSearchParams,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  BulkApproveLeaveRequest,
  BulkRejectLeaveRequest,
  BulkOperationResult,
  PendingLeaveSummary,
  // Attendance Update
  UpdateAttendanceRecordRequest,
  AttendanceRecordWithAudit,
} from '@hr-platform/shared-types';

export const attendanceService = {
  // Attendance - Backend uses /attendances (plural)
  async getTodayAttendance(): Promise<ApiResponse<TodayAttendance>> {
    const response = await apiClient.get<ApiResponse<TodayAttendance>>('/attendances/today');
    return response.data;
  },

  async checkIn(data?: CheckInRequest): Promise<ApiResponse<{ checkInTime: string }>> {
    const response = await apiClient.post<ApiResponse<{ checkInTime: string }>>('/attendances/check-in', data);
    return response.data;
  },

  async checkOut(data?: CheckOutRequest): Promise<ApiResponse<{ checkOutTime: string }>> {
    const response = await apiClient.post<ApiResponse<{ checkOutTime: string }>>('/attendances/check-out', data);
    return response.data;
  },

  async getAttendanceRecords(params?: AttendanceSearchParams): Promise<ApiResponse<PageResponse<AttendanceRecord>>> {
    // Backend returns paginated response at /attendances/my
    const response = await apiClient.get<ApiResponse<PageResponse<AttendanceRecord>>>('/attendances/my', {
      params,
    });
    return response.data;
  },

  async getMonthlySummary(yearMonth: string): Promise<ApiResponse<MonthlyAttendanceSummary>> {
    // Backend expects year and month as separate params
    const [year, month] = yearMonth.split('-');
    const response = await apiClient.get<ApiResponse<MonthlyAttendanceSummary>>('/attendances/my/summary', {
      params: { year: parseInt(year), month: parseInt(month) }
    });
    return response.data;
  },

  // Leave - Backend uses /leaves/my/balances
  async getLeaveBalance(): Promise<ApiResponse<LeaveBalance>> {
    // Returns aggregate leave balance summary
    const response = await apiClient.get<ApiResponse<LeaveBalance>>('/leaves/my/balances');
    return response.data;
  },

  async getLeaveBalanceByType(): Promise<ApiResponse<LeaveBalanceByType[]>> {
    const response = await apiClient.get<ApiResponse<LeaveBalanceByType[]>>('/leaves/balance/by-type');
    return response.data;
  },

  async getLeaveRequests(params?: LeaveSearchParams): Promise<ApiResponse<PageResponse<LeaveRequest>>> {
    // Backend uses /leaves/my for user's leave list
    const response = await apiClient.get<ApiResponse<PageResponse<LeaveRequest>>>('/leaves/my', {
      params,
    });
    return response.data;
  },

  async createLeaveRequest(data: CreateLeaveRequest): Promise<ApiResponse<LeaveRequest>> {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>('/leaves', data);
    return response.data;
  },

  async cancelLeaveRequest(id: string): Promise<ApiResponse<LeaveRequest>> {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`);
    return response.data;
  },

  // Leave Calendar - TODO: Backend needs to implement this endpoint
  async getLeaveCalendar(params: LeaveCalendarSearchParams): Promise<ApiResponse<LeaveCalendarEvent[]>> {
    const response = await apiClient.get<ApiResponse<LeaveCalendarEvent[]>>('/leaves/calendar', {
      params,
    });
    return response.data;
  },

  // Overtime - Backend uses /overtimes (plural)
  async getOvertimeList(params?: OvertimeSearchParams): Promise<ApiResponse<PageResponse<OvertimeRequestListItem>>> {
    // Backend uses /overtimes/my for user's overtime list
    const response = await apiClient.get<ApiResponse<PageResponse<OvertimeRequestListItem>>>('/overtimes/my', {
      params,
    });
    return response.data;
  },

  async getOvertimeSummary(yearMonth: string): Promise<ApiResponse<OvertimeSummary>> {
    // Backend uses /overtimes/my/total-hours with startDate/endDate params
    const [year, month] = yearMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
    const response = await apiClient.get<ApiResponse<OvertimeSummary>>('/overtimes/my/total-hours', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async createOvertime(data: CreateOvertimeRequest): Promise<ApiResponse<OvertimeRequest>> {
    const response = await apiClient.post<ApiResponse<OvertimeRequest>>('/overtimes', data);
    return response.data;
  },

  async cancelOvertime(id: string): Promise<ApiResponse<OvertimeRequest>> {
    const response = await apiClient.post<ApiResponse<OvertimeRequest>>(`/overtimes/${id}/cancel`);
    return response.data;
  },

  // ============================================
  // Work Hours Monitoring (주 52시간 모니터링)
  // ============================================

  async getWorkHoursStatistics(params?: WorkHoursSearchParams): Promise<ApiResponse<WorkHoursStatisticsResponse>> {
    // TODO: Backend needs to implement this endpoint
    const response = await apiClient.get<ApiResponse<WorkHoursStatisticsResponse>>('/attendances/statistics/work-hours', {
      params,
    });
    return response.data;
  },

  // ============================================
  // Leave Approval Management (휴가 승인 관리)
  // ============================================

  async getPendingLeaveRequests(params?: PendingLeaveSearchParams): Promise<ApiResponse<PageResponse<PendingLeaveRequest>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PendingLeaveRequest>>>('/leaves/pending', {
      params,
    });
    return response.data;
  },

  async getPendingLeaveSummary(): Promise<ApiResponse<PendingLeaveSummary>> {
    const response = await apiClient.get<ApiResponse<PendingLeaveSummary>>('/leaves/pending/summary');
    return response.data;
  },

  async getLeaveRequestDetail(id: string): Promise<ApiResponse<PendingLeaveRequest>> {
    const response = await apiClient.get<ApiResponse<PendingLeaveRequest>>(`/leaves/${id}`);
    return response.data;
  },

  async approveLeaveRequest(id: string, data?: ApproveLeaveRequest): Promise<ApiResponse<LeaveRequest>> {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`, data);
    return response.data;
  },

  async rejectLeaveRequest(id: string, data: RejectLeaveRequest): Promise<ApiResponse<LeaveRequest>> {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, data);
    return response.data;
  },

  async bulkApproveLeaveRequests(data: BulkApproveLeaveRequest): Promise<ApiResponse<BulkOperationResult>> {
    const response = await apiClient.post<ApiResponse<BulkOperationResult>>('/leaves/bulk-approve', data);
    return response.data;
  },

  async bulkRejectLeaveRequests(data: BulkRejectLeaveRequest): Promise<ApiResponse<BulkOperationResult>> {
    const response = await apiClient.post<ApiResponse<BulkOperationResult>>('/leaves/bulk-reject', data);
    return response.data;
  },

  // ============================================
  // Attendance Record Update (근태 수정)
  // ============================================

  async getAttendanceRecordDetail(id: string): Promise<ApiResponse<AttendanceRecordWithAudit>> {
    // Backend uses /attendances/{id} (singular path)
    const response = await apiClient.get<ApiResponse<AttendanceRecordWithAudit>>(`/attendances/${id}`);
    return response.data;
  },

  async updateAttendanceRecord(id: string, data: UpdateAttendanceRecordRequest): Promise<ApiResponse<AttendanceRecord>> {
    // TODO: Backend needs to implement PUT endpoint for attendance update
    const response = await apiClient.put<ApiResponse<AttendanceRecord>>(`/attendances/${id}`, data);
    return response.data;
  },
};
