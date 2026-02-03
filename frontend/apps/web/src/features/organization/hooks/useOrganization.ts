import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { organizationService, DepartmentSearchParams } from '../services/organizationService';
import type {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreateGradeRequest,
  UpdateGradeRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  DepartmentStatus,
} from '@hr-platform/shared-types';

export function useOrganizationTree() {
  return useQuery({
    queryKey: queryKeys.organizations.tree(),
    queryFn: () => organizationService.getOrganizationTree(),
  });
}

export function useDepartmentList(params?: DepartmentSearchParams) {
  return useQuery({
    queryKey: queryKeys.organizations.departments(params as Record<string, unknown> | undefined),
    queryFn: () => organizationService.getDepartments(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.organizations.department(id),
    queryFn: () => organizationService.getDepartment(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) => organizationService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentRequest }) =>
      organizationService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    },
  });
}

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.organizations.positions(),
    queryFn: () => organizationService.getPositions(),
  });
}

export function useGrades() {
  return useQuery({
    queryKey: queryKeys.organizations.grades(),
    queryFn: () => organizationService.getGrades(),
  });
}

// Grade Mutations
export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradeRequest) => organizationService.createGrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.grades() });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeRequest }) =>
      organizationService.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.grades() });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.deleteGrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.grades() });
    },
  });
}

// Position Mutations
export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePositionRequest) => organizationService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.positions() });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionRequest }) =>
      organizationService.updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.positions() });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.positions() });
    },
  });
}

// Search params hook
interface DepartmentSearchState {
  keyword: string;
  status: DepartmentStatus | '';
  page: number;
  size: number;
}

export function useDepartmentSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<DepartmentSearchState>({
    keyword: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<DepartmentSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setStatus = useCallback((status: DepartmentStatus | '') => {
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
