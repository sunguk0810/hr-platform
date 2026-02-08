import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryClient';
import { employeeService } from '../services/employeeService';
import type {
  EmployeeSearchParams,
  EmploymentStatus,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ResignationRequest,
  ResignationCancelRequest,
  EmployeeTransferRequest,
  EmployeeTransferApprovalRequest,
  EmployeeTransferSearchParams,
  EmployeeTransferStatus,
  UnmaskRequest,
  EmployeeHistorySearchParams,
  HistoryType,
  ConcurrentPositionSearchParams,
  ConcurrentPositionStatus,
  CreateConcurrentPositionRequest,
  UpdateConcurrentPositionRequest,
  EndConcurrentPositionRequest,
  PrivacyAccessRequestSearchParams,
  PrivacyAccessLogSearchParams,
  PrivacyAccessStatus,
  PrivacyField,
  CreatePrivacyAccessRequest,
  ApprovePrivacyAccessRequest,
} from '@hr-platform/shared-types';

// ===== 기본 Employee Hooks =====

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
  status: EmploymentStatus | '';
  page: number;
  size: number;
}

export function useEmployeeSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<EmployeeSearchState>({
    keyword: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<EmployeeSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.keyword && { keyword: searchState.keyword }),
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchState(prev => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setEmploymentStatus = useCallback((status: EmploymentStatus | '') => {
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
    setEmploymentStatus,
    setPage,
    resetFilters,
  };
}

// ===== 퇴직 처리 Hooks (SDD 4.3) =====

export function useResignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResignationRequest }) =>
      employeeService.resignation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
    },
  });
}

export function useResignationCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResignationCancelRequest }) =>
      employeeService.resignationCancel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
    },
  });
}

// ===== 전출/전입 Hooks (SDD 4.4) =====

export function useRequestTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeTransferRequest }) =>
      employeeService.requestTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useApproveTransferSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transferId, data }: { transferId: string; data?: EmployeeTransferApprovalRequest }) =>
      employeeService.approveTransferSource(transferId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useApproveTransferTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transferId, data }: { transferId: string; data?: EmployeeTransferApprovalRequest }) =>
      employeeService.approveTransferTarget(transferId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useSubmitTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferId: string) => employeeService.submitTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason: string }) =>
      employeeService.rejectTransfer(transferId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferId: string) => employeeService.completeTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason: string }) =>
      employeeService.cancelTransfer(transferId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useTransferList(params?: EmployeeTransferSearchParams) {
  return useQuery({
    queryKey: ['transfers', params],
    queryFn: () => employeeService.getTransfers(params),
  });
}

export function useTransfer(transferId: string) {
  return useQuery({
    queryKey: ['transfers', transferId],
    queryFn: () => employeeService.getTransfer(transferId),
    enabled: !!transferId,
  });
}

interface TransferSearchState {
  status: EmployeeTransferStatus | '';
  page: number;
  size: number;
}

export function useTransferSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<TransferSearchState>({
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<EmployeeTransferSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
  }), [searchState]);

  const setStatus = useCallback((status: EmployeeTransferStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setPage,
    resetFilters,
  };
}

// ===== 개인정보 마스킹 해제 Hook (SDD 4.5) =====

export function useUnmask() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UnmaskRequest }) =>
      employeeService.unmask(id, data),
  });
}

// ===== 인사기록카드 Hooks (SDD 4.6) =====

export function useRecordCard(id: string) {
  return useQuery({
    queryKey: ['recordCard', id],
    queryFn: () => employeeService.getRecordCard(id),
    enabled: !!id,
  });
}

export function useRecordCardPdf() {
  return useMutation({
    mutationFn: (id: string) => employeeService.getRecordCardPdf(id),
  });
}

// ===== 변경 이력 Hooks (SDD 3.2.7) =====

export function useEmployeeHistory(id: string, params?: EmployeeHistorySearchParams) {
  return useQuery({
    queryKey: ['employeeHistory', id, params],
    queryFn: () => employeeService.getHistory(id, params),
    enabled: !!id,
  });
}

interface HistorySearchState {
  historyType: HistoryType | '';
  page: number;
  size: number;
}

export function useHistorySearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<HistorySearchState>({
    historyType: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<EmployeeHistorySearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.historyType && { historyType: searchState.historyType }),
  }), [searchState]);

  const setHistoryType = useCallback((historyType: HistoryType | '') => {
    setSearchState(prev => ({ ...prev, historyType, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ historyType: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setHistoryType,
    setPage,
    resetFilters,
  };
}

// ===== 겸직/보직 관리 Hooks (PRD FR-ORG-002) =====

export function useConcurrentPositions(employeeId: string, params?: ConcurrentPositionSearchParams) {
  return useQuery({
    queryKey: ['concurrentPositions', employeeId, params],
    queryFn: () => employeeService.getConcurrentPositions(employeeId, params),
    enabled: !!employeeId,
  });
}

export function useConcurrentPosition(employeeId: string, positionId: string) {
  return useQuery({
    queryKey: ['concurrentPositions', employeeId, positionId],
    queryFn: () => employeeService.getConcurrentPosition(employeeId, positionId),
    enabled: !!employeeId && !!positionId,
  });
}

export function useCreateConcurrentPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConcurrentPositionRequest) =>
      employeeService.createConcurrentPosition(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concurrentPositions', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.employeeId) });
    },
  });
}

export function useUpdateConcurrentPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      positionId,
      data,
    }: {
      employeeId: string;
      positionId: string;
      data: UpdateConcurrentPositionRequest;
    }) => employeeService.updateConcurrentPosition(employeeId, positionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concurrentPositions', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.employeeId) });
    },
  });
}

export function useEndConcurrentPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      positionId,
      data,
    }: {
      employeeId: string;
      positionId: string;
      data: EndConcurrentPositionRequest;
    }) => employeeService.endConcurrentPosition(employeeId, positionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concurrentPositions', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.employeeId) });
    },
  });
}

export function useDeleteConcurrentPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, positionId }: { employeeId: string; positionId: string }) =>
      employeeService.deleteConcurrentPosition(employeeId, positionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concurrentPositions', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.employeeId) });
    },
  });
}

export function useSetPrimaryPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, positionId }: { employeeId: string; positionId: string }) =>
      employeeService.setPrimaryPosition(employeeId, positionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concurrentPositions', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.employeeId) });
    },
  });
}

interface ConcurrentPositionSearchState {
  status: ConcurrentPositionStatus | '';
  isPrimary: boolean | null;
  page: number;
  size: number;
}

export function useConcurrentPositionSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<ConcurrentPositionSearchState>({
    status: '',
    isPrimary: null,
    page: 0,
    size: initialSize,
  });

  const params = useMemo<ConcurrentPositionSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.isPrimary !== null && { isPrimary: searchState.isPrimary }),
  }), [searchState]);

  const setStatus = useCallback((status: ConcurrentPositionStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setIsPrimary = useCallback((isPrimary: boolean | null) => {
    setSearchState(prev => ({ ...prev, isPrimary, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ status: '', isPrimary: null, page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setIsPrimary,
    setPage,
    resetFilters,
  };
}

// ===== 개인정보 조회 승인/이력 Hooks (PRD FR-EMP-002) =====

export function usePrivacyAccessRequests(params?: PrivacyAccessRequestSearchParams) {
  return useQuery({
    queryKey: ['privacyAccessRequests', params],
    queryFn: () => employeeService.getPrivacyAccessRequests(params),
  });
}

export function usePrivacyAccessRequest(requestId: string) {
  return useQuery({
    queryKey: ['privacyAccessRequests', requestId],
    queryFn: () => employeeService.getPrivacyAccessRequest(requestId),
    enabled: !!requestId,
  });
}

export function useCreatePrivacyAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrivacyAccessRequest) =>
      employeeService.createPrivacyAccessRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyAccessRequests'] });
    },
  });
}

export function useApprovePrivacyAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string;
      data: ApprovePrivacyAccessRequest;
    }) => employeeService.approvePrivacyAccessRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyAccessRequests'] });
    },
  });
}

export function usePrivacyAccessLogs(params?: PrivacyAccessLogSearchParams) {
  return useQuery({
    queryKey: ['privacyAccessLogs', params],
    queryFn: () => employeeService.getPrivacyAccessLogs(params),
  });
}

export function useEmployeePrivacyAccessLogs(
  employeeId: string,
  params?: PrivacyAccessLogSearchParams
) {
  return useQuery({
    queryKey: ['privacyAccessLogs', employeeId, params],
    queryFn: () => employeeService.getEmployeePrivacyAccessLogs(employeeId, params),
    enabled: !!employeeId,
  });
}

interface PrivacyAccessRequestSearchState {
  status: PrivacyAccessStatus | '';
  targetEmployeeId: string;
  page: number;
  size: number;
}

export function usePrivacyAccessRequestSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<PrivacyAccessRequestSearchState>({
    status: '',
    targetEmployeeId: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<PrivacyAccessRequestSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.targetEmployeeId && { targetEmployeeId: searchState.targetEmployeeId }),
  }), [searchState]);

  const setStatus = useCallback((status: PrivacyAccessStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setTargetEmployeeId = useCallback((targetEmployeeId: string) => {
    setSearchState(prev => ({ ...prev, targetEmployeeId, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ status: '', targetEmployeeId: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setTargetEmployeeId,
    setPage,
    resetFilters,
  };
}

interface PrivacyAccessLogSearchState {
  field: PrivacyField | '';
  startDate: string;
  endDate: string;
  page: number;
  size: number;
}

export function usePrivacyAccessLogSearchParams(initialSize = 20) {
  const [searchState, setSearchState] = useState<PrivacyAccessLogSearchState>({
    field: '',
    startDate: '',
    endDate: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<PrivacyAccessLogSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.field && { field: searchState.field }),
    ...(searchState.startDate && { startDate: searchState.startDate }),
    ...(searchState.endDate && { endDate: searchState.endDate }),
  }), [searchState]);

  const setField = useCallback((field: PrivacyField | '') => {
    setSearchState(prev => ({ ...prev, field, page: 0 }));
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setSearchState(prev => ({ ...prev, startDate, endDate, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ field: '', startDate: '', endDate: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setField,
    setDateRange,
    setPage,
    resetFilters,
  };
}
