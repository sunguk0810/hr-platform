import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { transferService } from '../services/transferService';
import type {
  TransferSearchParams,
  CreateTransferRequest,
  UpdateTransferRequest,
  ApproveTransferRequest,
  RejectTransferRequest,
  TransferType,
  TransferStatus,
} from '@hr-platform/shared-types';

const transferKeys = {
  all: ['transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (params?: TransferSearchParams) => [...transferKeys.lists(), params] as const,
  details: () => [...transferKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferKeys.details(), id] as const,
  summary: () => [...transferKeys.all, 'summary'] as const,
  handoverItems: (id: string) => [...transferKeys.all, 'handover', id] as const,
  availableTenants: () => [...transferKeys.all, 'available-tenants'] as const,
  tenantDepartments: (tenantId: string) => [...transferKeys.all, 'tenants', tenantId, 'departments'] as const,
  tenantPositions: (tenantId: string) => [...transferKeys.all, 'tenants', tenantId, 'positions'] as const,
  tenantGrades: (tenantId: string) => [...transferKeys.all, 'tenants', tenantId, 'grades'] as const,
};

// 전출/전입 목록 조회
export function useTransfers(params?: TransferSearchParams) {
  return useQuery({
    queryKey: transferKeys.list(params),
    queryFn: () => transferService.getTransfers(params),
  });
}

// 전출/전입 상세 조회
export function useTransfer(id: string) {
  return useQuery({
    queryKey: transferKeys.detail(id),
    queryFn: () => transferService.getTransfer(id),
    enabled: !!id,
  });
}

// 요약 조회
export function useTransferSummary() {
  return useQuery({
    queryKey: transferKeys.summary(),
    queryFn: () => transferService.getSummary(),
  });
}

// 인수인계 항목 조회
export function useHandoverItems(transferId: string) {
  return useQuery({
    queryKey: transferKeys.handoverItems(transferId),
    queryFn: () => transferService.getHandoverItems(transferId),
    enabled: !!transferId,
  });
}

// 전입 가능 테넌트 조회
export function useAvailableTenants() {
  return useQuery({
    queryKey: transferKeys.availableTenants(),
    queryFn: () => transferService.getAvailableTenants(),
  });
}

// 테넌트 부서 조회
export function useTenantDepartments(tenantId: string) {
  return useQuery({
    queryKey: transferKeys.tenantDepartments(tenantId),
    queryFn: () => transferService.getTenantDepartments(tenantId),
    enabled: !!tenantId,
  });
}

// 테넌트 직책 조회
export function useTenantPositions(tenantId: string) {
  return useQuery({
    queryKey: transferKeys.tenantPositions(tenantId),
    queryFn: () => transferService.getTenantPositions(tenantId),
    enabled: !!tenantId,
  });
}

// 테넌트 직급 조회
export function useTenantGrades(tenantId: string) {
  return useQuery({
    queryKey: transferKeys.tenantGrades(tenantId),
    queryFn: () => transferService.getTenantGrades(tenantId),
    enabled: !!tenantId,
  });
}

// 전출/전입 요청 생성
export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferRequest) => transferService.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 전출/전입 요청 수정
export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransferRequest }) =>
      transferService.updateTransfer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
    },
  });
}

// 제출 (상신)
export function useSubmitTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transferService.submitTransfer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 전출 승인
export function useApproveSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveTransferRequest }) =>
      transferService.approveSource(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 전입 승인
export function useApproveTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveTransferRequest }) =>
      transferService.approveTarget(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 거부
export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectTransferRequest }) =>
      transferService.rejectTransfer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 완료 처리
export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transferService.completeTransfer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 취소
export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      transferService.cancelTransfer(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 삭제
export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transferService.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transferKeys.summary() });
    },
  });
}

// 인수인계 항목 완료
export function useCompleteHandoverItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transferId, itemId }: { transferId: string; itemId: string }) =>
      transferService.completeHandoverItem(transferId, itemId),
    onSuccess: (_, { transferId }) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.handoverItems(transferId) });
    },
  });
}

// 검색 파라미터 훅
interface TransferSearchState {
  keyword: string;
  type: TransferType | '';
  status: TransferStatus | '';
  page: number;
  size: number;
}

export function useTransferSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<TransferSearchState>({
    keyword: '',
    type: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<TransferSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.keyword && { keyword: searchState.keyword }),
      ...(searchState.type && { type: searchState.type }),
      ...(searchState.status && { status: searchState.status }),
    }),
    [searchState]
  );

  const setKeyword = useCallback((keyword: string) => {
    setSearchState((prev) => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setType = useCallback((type: TransferType | '') => {
    setSearchState((prev) => ({ ...prev, type, page: 0 }));
  }, []);

  const setStatus = useCallback((status: TransferStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', type: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setType,
    setStatus,
    setPage,
    resetFilters,
  };
}
