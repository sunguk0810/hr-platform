import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { approvalService, ApprovalListParams } from '../services/approvalService';
import type {
  CreateApprovalRequest,
  ApproveRequest,
  RejectRequest,
  ApprovalType,
  ApprovalStatus,
  CreateDelegationRequest,
} from '@hr-platform/shared-types';

export function useApprovalList(params?: ApprovalListParams) {
  return useQuery({
    queryKey: queryKeys.approvals.list(params as Record<string, unknown> | undefined),
    queryFn: () => approvalService.getApprovals(params),
  });
}

export function useApprovalSummary() {
  return useQuery({
    queryKey: queryKeys.approvals.summary(),
    queryFn: () => approvalService.getApprovalSummary(),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approvals.detail(id),
    queryFn: () => approvalService.getApproval(id),
    enabled: !!id,
  });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApprovalRequest) => approvalService.createApproval(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

export function useApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveRequest }) =>
      approvalService.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

export function useReject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectRequest }) =>
      approvalService.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

export function useCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approvalService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

// Delegation
export function useDelegations() {
  return useQuery({
    queryKey: ['delegations'],
    queryFn: () => approvalService.getDelegations(),
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDelegationRequest) => approvalService.createDelegation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

export function useCancelDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approvalService.cancelDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

// Employee Search (for delegation)
export function useEmployeeSearch(keyword: string) {
  return useQuery({
    queryKey: ['employees', 'search', keyword],
    queryFn: () => approvalService.searchEmployees(keyword),
    enabled: true, // Always fetch to show options
  });
}

// Search params
interface ApprovalSearchState {
  keyword: string;
  type: ApprovalType | '';
  status: ApprovalStatus | '';
  tab: 'pending' | 'requested' | 'completed' | 'draft' | '';
  page: number;
  size: number;
}

export function useApprovalSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<ApprovalSearchState>({
    keyword: '',
    type: '',
    status: '',
    tab: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<ApprovalListParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.type && { type: searchState.type }),
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.tab && { tab: searchState.tab }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setType = useCallback((type: ApprovalType | '') => {
    setSearchState(prev => ({ ...prev, type, page: 0 }));
  }, []);

  const setStatus = useCallback((status: ApprovalStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setTab = useCallback((tab: 'pending' | 'requested' | 'completed' | 'draft' | '') => {
    setSearchState(prev => ({ ...prev, tab, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', type: '', status: '', tab: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setType,
    setStatus,
    setTab,
    setPage,
    resetFilters,
  };
}
