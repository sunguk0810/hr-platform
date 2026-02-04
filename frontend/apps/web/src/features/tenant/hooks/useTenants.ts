import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { tenantService, PolicyDataMap } from '../services/tenantService';
import type {
  TenantSearchParams,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
  PolicyType,
  FeatureCode,
  TenantBranding,
  InheritPoliciesRequest,
  ToggleFeatureRequest,
  UpdateHierarchyRequest,
} from '@hr-platform/shared-types';

export function useTenantList(params?: TenantSearchParams) {
  return useQuery({
    queryKey: queryKeys.tenants.list(params as Record<string, unknown> | undefined),
    queryFn: () => tenantService.getTenants(params),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => tenantService.getTenant(id),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => tenantService.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) =>
      tenantService.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

export function useChangeTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantStatus }) =>
      tenantService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 트리 구조 조회
export function useTenantTree() {
  return useQuery({
    queryKey: [...queryKeys.tenants.all, 'tree'],
    queryFn: () => tenantService.getTenantTree(),
  });
}

// 계열사 목록 조회
export function useSubsidiaries(parentId: string) {
  return useQuery({
    queryKey: [...queryKeys.tenants.detail(parentId), 'subsidiaries'],
    queryFn: () => tenantService.getSubsidiaries(parentId),
    enabled: !!parentId,
  });
}

// 정책 수정
export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      policyType,
      data,
    }: {
      id: string;
      policyType: PolicyType;
      data: PolicyDataMap[PolicyType];
    }) => tenantService.updatePolicy(id, policyType, data as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 기능 목록 조회
export function useFeatures(id: string) {
  return useQuery({
    queryKey: [...queryKeys.tenants.detail(id), 'features'],
    queryFn: () => tenantService.getFeatures(id),
    enabled: !!id,
  });
}

// 기능 토글
export function useToggleFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      code,
      data,
    }: {
      id: string;
      code: FeatureCode;
      data: ToggleFeatureRequest;
    }) => tenantService.toggleFeature(id, code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 브랜딩 이미지 업로드
export function useUploadBrandingImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      type,
      file,
    }: {
      id: string;
      type: 'logo' | 'favicon' | 'background';
      file: File;
    }) => tenantService.uploadBrandingImage(id, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 브랜딩 수정
export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantBranding }) =>
      tenantService.updateBranding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 정책 상속
export function useInheritPolicies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, data }: { parentId: string; data: InheritPoliciesRequest }) =>
      tenantService.inheritPolicies(parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 모듈 설정 수정
export function useUpdateModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, modules }: { id: string; modules: string[] }) =>
      tenantService.updateModules(id, modules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// 정책 변경 이력 조회
export function usePolicyHistory(id: string, policyType?: PolicyType) {
  return useQuery({
    queryKey: [...queryKeys.tenants.detail(id), 'policy-history', policyType],
    queryFn: () => tenantService.getPolicyHistory(id, policyType),
    enabled: !!id,
  });
}

// 조직 계층 조회
export function useHierarchy(id: string) {
  return useQuery({
    queryKey: [...queryKeys.tenants.detail(id), 'hierarchy'],
    queryFn: () => tenantService.getHierarchy(id),
    enabled: !!id,
  });
}

// 조직 계층 수정
export function useUpdateHierarchy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHierarchyRequest }) =>
      tenantService.updateHierarchy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// Search params
interface TenantSearchState {
  keyword: string;
  status: TenantStatus | '';
  page: number;
  size: number;
}

export function useTenantSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<TenantSearchState>({
    keyword: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<TenantSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setStatus = useCallback((status: TenantStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setStatus,
    setPage,
    resetFilters,
  };
}
