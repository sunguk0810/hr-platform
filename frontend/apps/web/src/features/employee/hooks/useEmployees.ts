import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { employeeService } from '../services/employeeService';
import type { EmployeeSearchParams, EmploymentStatus, CreateEmployeeRequest, UpdateEmployeeRequest } from '@hr-platform/shared-types';

export function useEmployeeList(params?: EmployeeSearchParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params as Record<string, unknown> | undefined),
    queryFn: () => employeeService.getEmployees(params),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getEmployee(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => employeeService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

interface EmployeeSearchState {
  keyword: string;
  employmentStatus: EmploymentStatus | '';
  page: number;
  size: number;
}

export function useEmployeeSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<EmployeeSearchState>({
    keyword: '',
    employmentStatus: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<EmployeeSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.employmentStatus && { employmentStatus: searchState.employmentStatus }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setEmploymentStatus = useCallback((employmentStatus: EmploymentStatus | '') => {
    setSearchState(prev => ({ ...prev, employmentStatus, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', employmentStatus: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setEmploymentStatus,
    setPage,
    resetFilters,
  };
}
