import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { mdmService } from '../services/mdmService';
import type {
  CodeGroupSearchParams,
  CreateCodeGroupRequest,
  UpdateCodeGroupRequest,
  CommonCodeSearchParams,
  CreateCommonCodeRequest,
  UpdateCommonCodeRequest,
  UpdateCodeStatusRequest,
  CheckDuplicateRequest,
  CodeHistorySearchParams,
  CodeSearchParams,
  MigrateCodeRequest,
  TenantCodeSearchParams,
  UpdateTenantCodeRequest,
} from '@hr-platform/shared-types';

// Code Groups
export function useCodeGroupList(params?: CodeGroupSearchParams) {
  return useQuery({
    queryKey: queryKeys.mdm.codeGroups(params as Record<string, unknown> | undefined),
    queryFn: () => mdmService.getCodeGroups(params),
  });
}

export function useCodeGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.mdm.codeGroup(id),
    queryFn: () => mdmService.getCodeGroup(id),
    enabled: !!id,
  });
}

export function useCreateCodeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCodeGroupRequest) => mdmService.createCodeGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

export function useUpdateCodeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCodeGroupRequest }) =>
      mdmService.updateCodeGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

export function useDeleteCodeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mdmService.deleteCodeGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

// Common Codes
export function useCommonCodeList(params?: CommonCodeSearchParams) {
  return useQuery({
    queryKey: queryKeys.mdm.commonCodes(params as Record<string, unknown> | undefined),
    queryFn: () => mdmService.getCommonCodes(params),
  });
}

export function useCommonCode(id: string) {
  return useQuery({
    queryKey: queryKeys.mdm.commonCode(id),
    queryFn: () => mdmService.getCommonCode(id),
    enabled: !!id,
  });
}

export function useCreateCommonCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommonCodeRequest) => mdmService.createCommonCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

export function useUpdateCommonCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommonCodeRequest }) =>
      mdmService.updateCommonCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

export function useDeleteCommonCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mdmService.deleteCommonCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

// Get codes by group (for dropdowns)
export function useCodesByGroup(groupCode: string) {
  return useQuery({
    queryKey: queryKeys.mdm.codesByGroup(groupCode),
    queryFn: () => mdmService.getCodesByGroup(groupCode),
    enabled: !!groupCode,
  });
}

// Update code status
export function useUpdateCodeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCodeStatusRequest }) =>
      mdmService.updateCodeStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

// Update code group status
export function useUpdateCodeGroupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCodeStatusRequest }) =>
      mdmService.updateCodeGroupStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

// Check duplicate
export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (data: CheckDuplicateRequest) => mdmService.checkDuplicate(data),
  });
}

// Get code impact
export function useCodeImpact(id: string, enabled = false) {
  return useQuery({
    queryKey: ['mdm', 'impact', id],
    queryFn: () => mdmService.getCodeImpact(id),
    enabled: !!id && enabled,
  });
}

// Get code history
export function useCodeHistory(id: string, params?: CodeHistorySearchParams) {
  return useQuery({
    queryKey: ['mdm', 'history', id, params],
    queryFn: () => mdmService.getCodeHistory(id, params),
    enabled: !!id,
  });
}

// Search codes
export function useCodeSearch(params: CodeSearchParams, enabled = false) {
  return useQuery({
    queryKey: ['mdm', 'search', params],
    queryFn: () => mdmService.searchCodes(params),
    enabled: enabled && !!params.keyword,
  });
}

// Get code tree
export function useCodeTree(groupCode: string) {
  return useQuery({
    queryKey: ['mdm', 'tree', groupCode],
    queryFn: () => mdmService.getCodeTree(groupCode),
    enabled: !!groupCode,
  });
}

// Migration preview
export function useMigrationPreview(sourceCodeId: string, targetCodeId: string, enabled = false) {
  return useQuery({
    queryKey: ['mdm', 'migration', 'preview', sourceCodeId, targetCodeId],
    queryFn: () => mdmService.getMigrationPreview(sourceCodeId, targetCodeId),
    enabled: enabled && !!sourceCodeId && !!targetCodeId,
  });
}

// Migrate code
export function useMigrateCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MigrateCodeRequest) => mdmService.migrateCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mdm.all });
    },
  });
}

// Tenant codes
export function useTenantCodeList(params?: TenantCodeSearchParams) {
  return useQuery({
    queryKey: ['mdm', 'tenantCodes', params],
    queryFn: () => mdmService.getTenantCodes(params),
  });
}

export function useUpdateTenantCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId, data }: { codeId: string; data: UpdateTenantCodeRequest }) =>
      mdmService.updateTenantCode(codeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdm', 'tenantCodes'] });
    },
  });
}

export function useResetTenantCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (codeId: string) => mdmService.resetTenantCode(codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdm', 'tenantCodes'] });
    },
  });
}

// Search params hooks
interface CodeGroupSearchState {
  keyword: string;
  isActive: boolean | null;
  page: number;
  size: number;
}

export function useCodeGroupSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<CodeGroupSearchState>({
    keyword: '',
    isActive: null,
    page: 0,
    size: initialSize,
  });

  const params = useMemo<CodeGroupSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.isActive !== null && { isActive: searchState.isActive }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setIsActive = useCallback((isActive: boolean | null) => {
    setSearchState(prev => ({ ...prev, isActive, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', isActive: null, page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setIsActive,
    setPage,
    resetFilters,
  };
}

interface CommonCodeSearchState {
  groupCode: string;
  keyword: string;
  isActive: boolean | null;
  page: number;
  size: number;
}

export function useCommonCodeSearchParams(initialGroupCode = '', initialSize = 20) {
  const [searchState, setSearchState] = useState<CommonCodeSearchState>({
    groupCode: initialGroupCode,
    keyword: '',
    isActive: null,
    page: 0,
    size: initialSize,
  });

  const params = useMemo<CommonCodeSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.groupCode && { groupCode: searchState.groupCode }),
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.isActive !== null && { isActive: searchState.isActive }),
  }), [searchState]);

  const setGroupCode = useCallback((groupCode: string) => {
    setSearchState(prev => ({ ...prev, groupCode, page: 0 }));
  }, []);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setIsActive = useCallback((isActive: boolean | null) => {
    setSearchState(prev => ({ ...prev, isActive, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ groupCode: '', keyword: '', isActive: null, page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setGroupCode,
    setKeyword,
    setIsActive,
    setPage,
    resetFilters,
  };
}
