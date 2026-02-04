import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { appointmentService } from '../services/appointmentService';
import type {
  AppointmentSearchParams,
  DraftStatus,
  CreateAppointmentDraftRequest,
  UpdateAppointmentDraftRequest,
  CreateAppointmentDetailRequest,
  CancelAppointmentDraftRequest,
} from '@hr-platform/shared-types';

// ============================================
// Query Hooks
// ============================================

/**
 * 발령안 목록 조회
 */
export function useAppointmentDrafts(params?: AppointmentSearchParams) {
  return useQuery({
    queryKey: queryKeys.appointments.drafts(params as Record<string, unknown> | undefined),
    queryFn: () => appointmentService.getDrafts(params),
  });
}

/**
 * 발령안 상세 조회
 */
export function useAppointmentDraft(id: string) {
  return useQuery({
    queryKey: queryKeys.appointments.draft(id),
    queryFn: () => appointmentService.getDraft(id),
    enabled: !!id,
  });
}

/**
 * 발령안 상태별 요약 조회
 */
export function useAppointmentSummary() {
  return useQuery({
    queryKey: queryKeys.appointments.summary(),
    queryFn: () => appointmentService.getSummary(),
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * 발령안 생성
 */
export function useCreateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDraftRequest) => appointmentService.createDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
}

/**
 * 발령안 수정
 */
export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDraftRequest }) =>
      appointmentService.updateDraft(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.drafts() });
    },
  });
}

/**
 * 발령안 삭제
 */
export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
}

/**
 * 발령 상세 추가
 */
export function useAddDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId, data }: { draftId: string; data: CreateAppointmentDetailRequest }) =>
      appointmentService.addDetail(draftId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(variables.draftId) });
    },
  });
}

/**
 * 발령 상세 삭제
 */
export function useRemoveDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId, detailId }: { draftId: string; detailId: string }) =>
      appointmentService.removeDetail(draftId, detailId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(variables.draftId) });
    },
  });
}

/**
 * 결재 요청 (상신)
 */
export function useSubmitDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => appointmentService.submitForApproval(draftId),
    onSuccess: (_, draftId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(draftId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.drafts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.summary() });
    },
  });
}

/**
 * 발령 시행
 */
export function useExecuteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => appointmentService.executeDraft(draftId),
    onSuccess: (_, draftId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(draftId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.drafts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.summary() });
    },
  });
}

/**
 * 발령 취소
 */
export function useCancelDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId, data }: { draftId: string; data: CancelAppointmentDraftRequest }) =>
      appointmentService.cancelDraft(draftId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.draft(variables.draftId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.drafts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.summary() });
    },
  });
}

// ============================================
// Search Params Hook
// ============================================

interface AppointmentSearchState {
  status: DraftStatus | '';
  keyword: string;
  effectiveDateFrom: string;
  effectiveDateTo: string;
  page: number;
  size: number;
}

export function useAppointmentSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<AppointmentSearchState>({
    status: '',
    keyword: '',
    effectiveDateFrom: '',
    effectiveDateTo: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<AppointmentSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.effectiveDateFrom && { effectiveDateFrom: searchState.effectiveDateFrom }),
    ...(searchState.effectiveDateTo && { effectiveDateTo: searchState.effectiveDateTo }),
  }), [searchState]);

  const setStatus = useCallback((status: DraftStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setDateRange = useCallback((effectiveDateFrom: string, effectiveDateTo: string) => {
    setSearchState(prev => ({ ...prev, effectiveDateFrom, effectiveDateTo, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({
      status: '',
      keyword: '',
      effectiveDateFrom: '',
      effectiveDateTo: '',
      page: 0,
      size: initialSize,
    });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setKeyword,
    setDateRange,
    setPage,
    resetFilters,
  };
}
