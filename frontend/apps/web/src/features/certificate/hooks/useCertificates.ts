import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { certificateService } from '../services/certificateService';
import type {
  CreateCertificateRequestRequest,
  CertificateRequestSearchParams,
  CertificateIssueSearchParams,
  RequestStatus,
} from '@hr-platform/shared-types';

// ===== 증명서 유형 Hooks =====

export function useCertificateTypes() {
  return useQuery({
    queryKey: queryKeys.certificates.types(),
    queryFn: () => certificateService.getCertificateTypes(),
  });
}

export function useCertificateType(code: string) {
  return useQuery({
    queryKey: queryKeys.certificates.type(code),
    queryFn: () => certificateService.getCertificateType(code),
    enabled: !!code,
  });
}

// ===== 증명서 신청 Hooks =====

export function useMyRequests(params?: CertificateRequestSearchParams) {
  return useQuery({
    queryKey: queryKeys.certificates.requests(params as Record<string, unknown> | undefined),
    queryFn: () => certificateService.getMyRequests(params),
  });
}

export function useCertificateRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.certificates.request(id),
    queryFn: () => certificateService.getRequest(id),
    enabled: !!id,
  });
}

export function useCreateCertificateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificateRequestRequest) => certificateService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all });
    },
  });
}

export function useCancelCertificateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      certificateService.cancelRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all });
    },
  });
}

// ===== 발급 이력 Hooks =====

export function useMyIssues(params?: CertificateIssueSearchParams) {
  return useQuery({
    queryKey: queryKeys.certificates.issues(params as Record<string, unknown> | undefined),
    queryFn: () => certificateService.getMyIssues(params),
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (issueNumber: string) => certificateService.downloadCertificate(issueNumber),
  });
}

// ===== 진위확인 Hook =====

export function useVerifyCertificate(verificationCode: string) {
  return useQuery({
    queryKey: queryKeys.certificates.verification(verificationCode),
    queryFn: () => certificateService.verifyCertificate(verificationCode),
    enabled: !!verificationCode && verificationCode.length >= 8,
  });
}

// ===== Search State Hooks =====

interface CertificateRequestSearchState {
  status: RequestStatus | '';
  typeCode: string;
  page: number;
  size: number;
}

export function useCertificateRequestSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<CertificateRequestSearchState>({
    status: '',
    typeCode: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<CertificateRequestSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.status && { status: searchState.status }),
    ...(searchState.typeCode && { typeCode: searchState.typeCode }),
  }), [searchState]);

  const setStatus = useCallback((status: RequestStatus | '') => {
    setSearchState(prev => ({ ...prev, status, page: 0 }));
  }, []);

  const setTypeCode = useCallback((typeCode: string) => {
    setSearchState(prev => ({ ...prev, typeCode, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ status: '', typeCode: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setStatus,
    setTypeCode,
    setPage,
    resetFilters,
  };
}

interface CertificateIssueSearchState {
  typeCode: string;
  includeExpired: boolean;
  page: number;
  size: number;
}

export function useCertificateIssueSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<CertificateIssueSearchState>({
    typeCode: '',
    includeExpired: false,
    page: 0,
    size: initialSize,
  });

  const params = useMemo<CertificateIssueSearchParams>(() => ({
    page: searchState.page,
    size: searchState.size,
    ...(searchState.typeCode && { typeCode: searchState.typeCode }),
    ...(searchState.includeExpired && { includeExpired: searchState.includeExpired }),
  }), [searchState]);

  const setTypeCode = useCallback((typeCode: string) => {
    setSearchState(prev => ({ ...prev, typeCode, page: 0 }));
  }, []);

  const setIncludeExpired = useCallback((includeExpired: boolean) => {
    setSearchState(prev => ({ ...prev, includeExpired, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ typeCode: '', includeExpired: false, page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setTypeCode,
    setIncludeExpired,
    setPage,
    resetFilters,
  };
}
