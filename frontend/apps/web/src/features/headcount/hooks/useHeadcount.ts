import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { headcountService } from '../services/headcountService';
import type {
  HeadcountPlanSearchParams,
  HeadcountRequestSearchParams,
  CreateHeadcountPlanRequest,
  UpdateHeadcountPlanRequest,
  CreateHeadcountRequest,
  HeadcountStatus,
  HeadcountRequestStatus,
  HeadcountRequestType,
} from '@hr-platform/shared-types';

const headcountKeys = {
  all: ['headcount'] as const,
  plans: () => [...headcountKeys.all, 'plans'] as const,
  planList: (params?: HeadcountPlanSearchParams) => [...headcountKeys.plans(), 'list', params] as const,
  planDetail: (id: string) => [...headcountKeys.plans(), 'detail', id] as const,
  summary: (year: number) => [...headcountKeys.all, 'summary', year] as const,
  requests: () => [...headcountKeys.all, 'requests'] as const,
  requestList: (params?: HeadcountRequestSearchParams) => [...headcountKeys.requests(), 'list', params] as const,
  requestDetail: (id: string) => [...headcountKeys.requests(), 'detail', id] as const,
};

// 정현원 계획 목록 조회
export function useHeadcountPlans(params?: HeadcountPlanSearchParams) {
  return useQuery({
    queryKey: headcountKeys.planList(params),
    queryFn: () => headcountService.getPlans(params),
  });
}

// 정현원 계획 상세 조회
export function useHeadcountPlan(id: string) {
  return useQuery({
    queryKey: headcountKeys.planDetail(id),
    queryFn: () => headcountService.getPlan(id),
    enabled: !!id,
  });
}

// 정현원 요약 조회
export function useHeadcountSummary(year: number) {
  return useQuery({
    queryKey: headcountKeys.summary(year),
    queryFn: () => headcountService.getSummary(year),
    enabled: !!year,
  });
}

// 정현원 계획 생성
export function useCreateHeadcountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHeadcountPlanRequest) => headcountService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.plans() });
    },
  });
}

// 정현원 계획 수정
export function useUpdateHeadcountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHeadcountPlanRequest }) =>
      headcountService.updatePlan(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.planDetail(id) });
      queryClient.invalidateQueries({ queryKey: headcountKeys.plans() });
    },
  });
}

// 정현원 계획 삭제
export function useDeleteHeadcountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => headcountService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.plans() });
    },
  });
}

// 정현원 계획 승인
export function useApproveHeadcountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => headcountService.approvePlan(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.planDetail(id) });
      queryClient.invalidateQueries({ queryKey: headcountKeys.plans() });
    },
  });
}

// 정현원 변경 요청 목록 조회
export function useHeadcountRequests(params?: HeadcountRequestSearchParams) {
  return useQuery({
    queryKey: headcountKeys.requestList(params),
    queryFn: () => headcountService.getRequests(params),
  });
}

// 정현원 변경 요청 상세 조회
export function useHeadcountRequest(id: string) {
  return useQuery({
    queryKey: headcountKeys.requestDetail(id),
    queryFn: () => headcountService.getRequest(id),
    enabled: !!id,
  });
}

// 정현원 변경 요청 생성
export function useCreateHeadcountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHeadcountRequest) => headcountService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.requests() });
    },
  });
}

// 정현원 변경 요청 승인
export function useApproveHeadcountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => headcountService.approveRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.requestDetail(id) });
      queryClient.invalidateQueries({ queryKey: headcountKeys.requests() });
      queryClient.invalidateQueries({ queryKey: headcountKeys.plans() });
    },
  });
}

// 정현원 변경 요청 반려
export function useRejectHeadcountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      headcountService.rejectRequest(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.requestDetail(id) });
      queryClient.invalidateQueries({ queryKey: headcountKeys.requests() });
    },
  });
}

// 정현원 변경 요청 취소
export function useCancelHeadcountRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => headcountService.cancelRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: headcountKeys.requestDetail(id) });
      queryClient.invalidateQueries({ queryKey: headcountKeys.requests() });
    },
  });
}

// 정현원 계획 검색 파라미터 훅
interface HeadcountPlanSearchState {
  year: number;
  departmentId: string;
  status: HeadcountStatus | '';
  page: number;
  size: number;
}

export function useHeadcountPlanSearchParams(initialSize = 10) {
  const currentYear = new Date().getFullYear();
  const [searchState, setSearchState] = useState<HeadcountPlanSearchState>({
    year: currentYear,
    departmentId: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<HeadcountPlanSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      year: searchState.year,
      ...(searchState.departmentId && { departmentId: searchState.departmentId }),
      ...(searchState.status && { status: searchState.status }),
    }),
    [searchState]
  );

  const setYear = useCallback((year: number) => {
    setSearchState((prev) => ({ ...prev, year, page: 0 }));
  }, []);

  const setDepartmentId = useCallback((departmentId: string) => {
    setSearchState((prev) => ({ ...prev, departmentId, page: 0 }));
  }, []);

  const setStatus = useCallback((status: HeadcountStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({
      year: currentYear,
      departmentId: '',
      status: '',
      page: 0,
      size: initialSize,
    });
  }, [currentYear, initialSize]);

  return {
    params,
    searchState,
    setYear,
    setDepartmentId,
    setStatus,
    setPage,
    resetFilters,
  };
}

// 정현원 변경 요청 검색 파라미터 훅
interface HeadcountRequestSearchState {
  type: HeadcountRequestType | '';
  status: HeadcountRequestStatus | '';
  departmentId: string;
  page: number;
  size: number;
}

export function useHeadcountRequestSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<HeadcountRequestSearchState>({
    type: '',
    status: '',
    departmentId: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<HeadcountRequestSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.type && { type: searchState.type }),
      ...(searchState.status && { status: searchState.status }),
      ...(searchState.departmentId && { departmentId: searchState.departmentId }),
    }),
    [searchState]
  );

  const setType = useCallback((type: HeadcountRequestType | '') => {
    setSearchState((prev) => ({ ...prev, type, page: 0 }));
  }, []);

  const setStatus = useCallback((status: HeadcountRequestStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setDepartmentId = useCallback((departmentId: string) => {
    setSearchState((prev) => ({ ...prev, departmentId, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({
      type: '',
      status: '',
      departmentId: '',
      page: 0,
      size: initialSize,
    });
  }, [initialSize]);

  return {
    params,
    searchState,
    setType,
    setStatus,
    setDepartmentId,
    setPage,
    resetFilters,
  };
}
