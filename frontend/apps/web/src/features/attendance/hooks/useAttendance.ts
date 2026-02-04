import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { getISOWeek, getYear, addWeeks, subWeeks } from 'date-fns';
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
  WorkHoursSearchParams,
  WorkHourStatus,
  UpdateAttendanceRecordRequest,
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

// ============================================
// Work Hours Monitoring (주 52시간 모니터링)
// ============================================

function getCurrentWeekPeriod(): string {
  const now = new Date();
  return `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
}

function parseWeekPeriod(weekPeriod: string): Date {
  const [year, week] = weekPeriod.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return weekStart;
}

export function useWorkHoursStatistics(params?: WorkHoursSearchParams) {
  return useQuery({
    queryKey: ['attendance', 'workHours', params],
    queryFn: () => attendanceService.getWorkHoursStatistics(params),
  });
}

interface WorkHoursSearchState {
  weekPeriod: string;
  departmentId: string;
  status: WorkHourStatus | '';
}

export function useWorkHoursSearchParams() {
  const [searchState, setSearchState] = useState<WorkHoursSearchState>({
    weekPeriod: getCurrentWeekPeriod(),
    departmentId: '',
    status: '',
  });

  const params = useMemo<WorkHoursSearchParams>(() => ({
    weekPeriod: searchState.weekPeriod,
    ...(searchState.departmentId && { departmentId: searchState.departmentId }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const weekDate = useMemo(() => parseWeekPeriod(searchState.weekPeriod), [searchState.weekPeriod]);

  const goToPreviousWeek = useCallback(() => {
    const prevWeek = subWeeks(weekDate, 1);
    const period = `${getYear(prevWeek)}-W${String(getISOWeek(prevWeek)).padStart(2, '0')}`;
    setSearchState(prev => ({ ...prev, weekPeriod: period }));
  }, [weekDate]);

  const goToNextWeek = useCallback(() => {
    const nextWeek = addWeeks(weekDate, 1);
    const period = `${getYear(nextWeek)}-W${String(getISOWeek(nextWeek)).padStart(2, '0')}`;
    setSearchState(prev => ({ ...prev, weekPeriod: period }));
  }, [weekDate]);

  const goToCurrentWeek = useCallback(() => {
    setSearchState(prev => ({ ...prev, weekPeriod: getCurrentWeekPeriod() }));
  }, []);

  const setDepartmentId = useCallback((departmentId: string) => {
    setSearchState(prev => ({ ...prev, departmentId }));
  }, []);

  const setStatus = useCallback((status: WorkHourStatus | '') => {
    setSearchState(prev => ({ ...prev, status }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({
      weekPeriod: getCurrentWeekPeriod(),
      departmentId: '',
      status: '',
    });
  }, []);

  const isCurrentWeek = searchState.weekPeriod === getCurrentWeekPeriod();

  return {
    params,
    searchState,
    weekDate,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setDepartmentId,
    setStatus,
    resetFilters,
  };
}

// ============================================
// Attendance Record Update (근태 수정)
// ============================================

export function useAttendanceRecordDetail(id: string) {
  return useQuery({
    queryKey: ['attendance', 'record', id],
    queryFn: () => attendanceService.getAttendanceRecordDetail(id),
    enabled: !!id,
  });
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAttendanceRecordRequest }) =>
      attendanceService.updateAttendanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}
