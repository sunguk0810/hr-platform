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
} from '@hr-platform/shared-types';

export const attendanceService = {
  // Attendance
  async getTodayAttendance(): Promise<ApiResponse<TodayAttendance>> {
    const response = await apiClient.get<ApiResponse<TodayAttendance>>('/attendance/today');
    return response.data;
  },

  async checkIn(data?: CheckInRequest): Promise<ApiResponse<{ checkInTime: string }>> {
    const response = await apiClient.post<ApiResponse<{ checkInTime: string }>>('/attendance/check-in', data);
    return response.data;
  },

  async checkOut(data?: CheckOutRequest): Promise<ApiResponse<{ checkOutTime: string }>> {
    const response = await apiClient.post<ApiResponse<{ checkOutTime: string }>>('/attendance/check-out', data);
    return response.data;
  },

  async getAttendanceRecords(params?: AttendanceSearchParams): Promise<ApiResponse<PageResponse<AttendanceRecord>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AttendanceRecord>>>('/attendance/records', {
      params,
    });
    return response.data;
  },

  async getMonthlySummary(yearMonth: string): Promise<ApiResponse<MonthlyAttendanceSummary>> {
    const response = await apiClient.get<ApiResponse<MonthlyAttendanceSummary>>(`/attendance/summary/${yearMonth}`);
    return response.data;
  },

  // Leave
  async getLeaveBalance(): Promise<ApiResponse<LeaveBalance>> {
    const response = await apiClient.get<ApiResponse<LeaveBalance>>('/leaves/balance');
    return response.data;
  },

  async getLeaveBalanceByType(): Promise<ApiResponse<LeaveBalanceByType[]>> {
    const response = await apiClient.get<ApiResponse<LeaveBalanceByType[]>>('/leaves/balance/by-type');
    return response.data;
  },

  async getLeaveRequests(params?: LeaveSearchParams): Promise<ApiResponse<PageResponse<LeaveRequest>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<LeaveRequest>>>('/leaves', {
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

  // Leave Calendar
  async getLeaveCalendar(params: LeaveCalendarSearchParams): Promise<ApiResponse<LeaveCalendarEvent[]>> {
    const response = await apiClient.get<ApiResponse<LeaveCalendarEvent[]>>('/leaves/calendar', {
      params,
    });
    return response.data;
  },

  // Overtime
  async getOvertimeList(params?: OvertimeSearchParams): Promise<ApiResponse<PageResponse<OvertimeRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<OvertimeRequestListItem>>>('/overtime', {
      params,
    });
    return response.data;
  },

  async getOvertimeSummary(yearMonth: string): Promise<ApiResponse<OvertimeSummary>> {
    const response = await apiClient.get<ApiResponse<OvertimeSummary>>(`/overtime/summary/${yearMonth}`);
    return response.data;
  },

  async createOvertime(data: CreateOvertimeRequest): Promise<ApiResponse<OvertimeRequest>> {
    const response = await apiClient.post<ApiResponse<OvertimeRequest>>('/overtime', data);
    return response.data;
  },

  async cancelOvertime(id: string): Promise<ApiResponse<OvertimeRequest>> {
    const response = await apiClient.post<ApiResponse<OvertimeRequest>>(`/overtime/${id}/cancel`);
    return response.data;
  },
};
