import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
  RecallRequest,
  DelegateRequest,
  DirectApproveRequest,
  DelegationRuleSearchParams,
  DelegationRuleStatus,
  DelegationRuleConditionType,
  CreateDelegationRuleRequest,
  UpdateDelegationRuleRequest,
} from '@hr-platform/shared-types';

export function useApprovalList(params?: ApprovalListParams) {
  return useQuery({
    queryKey: queryKeys.approvals.list(params as Record<string, unknown> | undefined),
    queryFn: () => approvalService.getApprovals(params),
  });
}

/**
 * 무한 스크롤용 결재 목록 조회 hook
 */
export function useInfiniteApprovalList(params?: Omit<ApprovalListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.approvals.all, 'infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      approvalService.getApprovals({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const data = lastPage?.data;
      if (!data) return undefined;
      return data.page.last ? undefined : data.page.number + 1;
    },
    initialPageParam: 0,
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

// SDD 4.4 회수
export function useRecall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecallRequest }) =>
      approvalService.recall(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

// SDD 4.6 대결
export function useDelegate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stepId, data }: { id: string; stepId: string; data: DelegateRequest }) =>
      approvalService.delegate(id, stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

// SDD 4.7 전결
export function useDirectApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DirectApproveRequest }) =>
      approvalService.directApprove(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}

// SDD 4.5 결재 이력 조회
export function useApprovalHistory(id: string) {
  return useQuery({
    queryKey: [...queryKeys.approvals.detail(id), 'history'],
    queryFn: () => approvalService.getHistory(id),
    enabled: !!id,
  });
}

// SDD 3.3.4 결재 양식 목록 조회
export function useApprovalTemplates(params?: { category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.approvals.templates(), params],
    queryFn: () => approvalService.getTemplates(params),
  });
}

// SDD 3.3.4 결재 양식 상세 조회
export function useApprovalTemplate(id: string) {
  return useQuery({
    queryKey: [...queryKeys.approvals.templates(), id],
    queryFn: () => approvalService.getTemplate(id),
    enabled: !!id,
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

// ===== PRD FR-APR-003: 위임전결 규칙 =====

export function useDelegationRules(params?: DelegationRuleSearchParams) {
  return useQuery({
    queryKey: ['delegationRules', params],
    queryFn: () => approvalService.getDelegationRules(params),
  });
}

export function useDelegationRule(id: string) {
  return useQuery({
    queryKey: ['delegationRules', id],
    queryFn: () => approvalService.getDelegationRule(id),
    enabled: !!id,
  });
}

export function useCreateDelegationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDelegationRuleRequest) => approvalService.createDelegationRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegationRules'] });
    },
  });
}

export function useUpdateDelegationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDelegationRuleRequest }) =>
      approvalService.updateDelegationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegationRules'] });
    },
  });
}

export function useDeleteDelegationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approvalService.deleteDelegationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegationRules'] });
    },
  });
}

export function useToggleDelegationRuleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approvalService.toggleDelegationRuleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegationRules'] });
    },
  });
}

interface DelegationRuleSearchState {
  status: DelegationRuleStatus | '';
  conditionType: DelegationRuleConditionType | '';
  page: number;
  size: number;
}

export function useDelegationRuleSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<DelegationRuleSearchState>({
    status: '',
    conditionType: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<DelegationRuleSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.conditionType && { conditionType: searchState.conditionType }),
  }), [searchState]);

  const setStatus = useCallback((status: DelegationRuleStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setConditionType = useCallback((conditionType: DelegationRuleConditionType | '') => {
    setSearchState(prev => ({ ...prev, conditionType, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ status: '', conditionType: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setConditionType,
    setPage,
    resetFilters,
  };
}
