import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { attendanceService } from '../services/attendanceService';
import type {
  PendingLeaveSearchParams,
  LeaveType,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  BulkApproveLeaveRequest,
  BulkRejectLeaveRequest,
} from '@hr-platform/shared-types';

// ============================================
// Leave Approval Management (휴가 승인 관리)
// ============================================

export function usePendingLeaveRequests(params?: PendingLeaveSearchParams) {
  return useQuery({
    queryKey: ['leaves', 'pending', params],
    queryFn: () => attendanceService.getPendingLeaveRequests(params),
  });
}

export function usePendingLeaveSummary() {
  return useQuery({
    queryKey: ['leaves', 'pending', 'summary'],
    queryFn: () => attendanceService.getPendingLeaveSummary(),
  });
}

export function useLeaveRequestDetail(id: string) {
  return useQuery({
    queryKey: ['leaves', 'detail', id],
    queryFn: () => attendanceService.getLeaveRequestDetail(id),
    enabled: !!id,
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveLeaveRequest }) =>
      attendanceService.approveLeaveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectLeaveRequest }) =>
      attendanceService.rejectLeaveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useBulkApproveLeaveRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkApproveLeaveRequest) =>
      attendanceService.bulkApproveLeaveRequests(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useBulkRejectLeaveRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRejectLeaveRequest) =>
      attendanceService.bulkRejectLeaveRequests(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

// Search params hook
interface PendingLeaveSearchState {
  departmentId: string;
  leaveType: LeaveType | '';
  page: number;
  size: number;
}

export function usePendingLeaveSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<PendingLeaveSearchState>({
    departmentId: '',
    leaveType: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<PendingLeaveSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.departmentId && { departmentId: searchState.departmentId }),
    ...(searchState.leaveType && { leaveType: searchState.leaveType }),
  }), [searchState]);

  const setDepartmentId = useCallback((departmentId: string) => {
    setSearchState(prev => ({ ...prev, departmentId, page: 0 }));
  }, []);

  const setLeaveType = useCallback((leaveType: LeaveType | '') => {
    setSearchState(prev => ({ ...prev, leaveType, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({
      departmentId: '',
      leaveType: '',
      page: 0,
      size: initialSize,
    });
  }, [initialSize]);

  return {
    params,
    searchState,
    setDepartmentId,
    setLeaveType,
    setPage,
    resetFilters,
  };
}

// Selection management hook
export function useLeaveRequestSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedCount = selectedIds.size;
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  };
}
