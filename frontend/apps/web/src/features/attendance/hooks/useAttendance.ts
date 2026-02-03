import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { attendanceService } from '../services/attendanceService';
import type {
  AttendanceSearchParams,
  LeaveSearchParams,
  CreateLeaveRequest,
  LeaveStatus,
  LeaveType,
  AttendanceStatus,
  LeaveCalendarSearchParams,
  OvertimeSearchParams,
  CreateOvertimeRequest,
} from '@hr-platform/shared-types';

// Attendance
export function useTodayAttendance() {
  return useQuery({
    queryKey: queryKeys.attendance.today(),
    queryFn: () => attendanceService.getTodayAttendance(),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });
}

export function useAttendanceRecords(params?: AttendanceSearchParams) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params as Record<string, unknown> | undefined),
    queryFn: () => attendanceService.getAttendanceRecords(params),
  });
}

export function useMonthlySummary(yearMonth: string) {
  return useQuery({
    queryKey: queryKeys.attendance.summary(yearMonth),
    queryFn: () => attendanceService.getMonthlySummary(yearMonth),
    enabled: !!yearMonth,
  });
}

// Leave
export function useLeaveBalance() {
  return useQuery({
    queryKey: queryKeys.leaves.balance(),
    queryFn: () => attendanceService.getLeaveBalance(),
  });
}

export function useLeaveBalanceByType() {
  return useQuery({
    queryKey: queryKeys.leaves.balanceByType(),
    queryFn: () => attendanceService.getLeaveBalanceByType(),
  });
}

export function useLeaveRequests(params?: LeaveSearchParams) {
  return useQuery({
    queryKey: queryKeys.leaves.list(params as Record<string, unknown> | undefined),
    queryFn: () => attendanceService.getLeaveRequests(params),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => attendanceService.createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.leaveBalance() });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attendanceService.cancelLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.leaveBalance() });
    },
  });
}

// Leave Calendar
export function useLeaveCalendar(params: LeaveCalendarSearchParams) {
  return useQuery({
    queryKey: ['leaves', 'calendar', params],
    queryFn: () => attendanceService.getLeaveCalendar(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

// Overtime
export function useOvertimeList(params?: OvertimeSearchParams) {
  return useQuery({
    queryKey: ['overtime', 'list', params],
    queryFn: () => attendanceService.getOvertimeList(params),
  });
}

export function useOvertimeSummary(yearMonth: string) {
  return useQuery({
    queryKey: ['overtime', 'summary', yearMonth],
    queryFn: () => attendanceService.getOvertimeSummary(yearMonth),
    enabled: !!yearMonth,
  });
}

export function useCreateOvertime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOvertimeRequest) => attendanceService.createOvertime(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
    },
  });
}

export function useCancelOvertime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attendanceService.cancelOvertime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
    },
  });
}

// Search params
interface AttendanceSearchState {
  startDate: string;
  endDate: string;
  status: AttendanceStatus | '';
  page: number;
  size: number;
}

export function useAttendanceSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<AttendanceSearchState>({
    startDate: '',
    endDate: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<AttendanceSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.startDate && { startDate: searchState.startDate }),
    ...(searchState.endDate && { endDate: searchState.endDate }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setSearchState(prev => ({ ...prev, startDate, endDate, page: 0 }));
  }, []);

  const setStatus = useCallback((status: AttendanceStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ startDate: '', endDate: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setDateRange,
    setStatus,
    setPage,
    resetFilters,
  };
}

interface LeaveSearchState {
  leaveType: LeaveType | '';
  status: LeaveStatus | '';
  page: number;
  size: number;
}

export function useLeaveSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<LeaveSearchState>({
    leaveType: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<LeaveSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.leaveType && { leaveType: searchState.leaveType }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setLeaveType = useCallback((leaveType: LeaveType | '') => {
    setSearchState(prev => ({ ...prev, leaveType, page: 0 }));
  }, []);

  const setStatus = useCallback((status: LeaveStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ leaveType: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setLeaveType,
    setStatus,
    setPage,
    resetFilters,
  };
}
