import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { tenantService } from '../services/tenantService';
import type {
  TenantSearchParams,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
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
