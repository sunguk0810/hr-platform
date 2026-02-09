import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { condolenceService, CondolencePaymentSearchParams, ProcessPaymentRequest } from '../services/condolenceService';
import type { CondolenceSearchParams, CreateCondolenceRequest, CondolencePolicy } from '@hr-platform/shared-types';

const condolenceKeys = {
  all: ['condolences'] as const,
  lists: () => [...condolenceKeys.all, 'list'] as const,
  list: (params?: CondolenceSearchParams) => [...condolenceKeys.lists(), params] as const,
  details: () => [...condolenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...condolenceKeys.details(), id] as const,
  policies: () => [...condolenceKeys.all, 'policies'] as const,
  payments: () => [...condolenceKeys.all, 'payments'] as const,
  paymentPending: (params?: CondolencePaymentSearchParams) => [...condolenceKeys.payments(), 'pending', params] as const,
  paymentHistory: (params?: CondolencePaymentSearchParams) => [...condolenceKeys.payments(), 'history', params] as const,
};

export function useCondolenceRequests(params?: CondolenceSearchParams) {
  return useQuery({
    queryKey: condolenceKeys.list(params),
    queryFn: () => condolenceService.getRequests(params),
  });
}

export function useCondolenceRequest(id: string) {
  return useQuery({
    queryKey: condolenceKeys.detail(id),
    queryFn: () => condolenceService.getRequest(id),
    enabled: !!id,
  });
}

export function useCondolencePolicies() {
  return useQuery({
    queryKey: condolenceKeys.policies(),
    queryFn: () => condolenceService.getPolicies(),
  });
}

export function useCreateCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCondolenceRequest) => condolenceService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function useApproveCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => condolenceService.approveRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function useRejectCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      condolenceService.rejectRequest(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function useUpdateCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCondolenceRequest> }) =>
      condolenceService.updateRequest(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function useDeleteCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => condolenceService.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function useCancelCondolenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => condolenceService.cancelRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
    },
  });
}

export function usePaymentPendingList(params?: CondolencePaymentSearchParams) {
  return useQuery({
    queryKey: condolenceKeys.paymentPending(params),
    queryFn: () => condolenceService.getPaymentPendingList(params),
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessPaymentRequest }) =>
      condolenceService.processPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.payments() });
    },
  });
}

export function useBulkProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: ProcessPaymentRequest }) =>
      condolenceService.bulkProcessPayment(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: condolenceKeys.payments() });
    },
  });
}

export function usePaymentHistory(params?: CondolencePaymentSearchParams) {
  return useQuery({
    queryKey: condolenceKeys.paymentHistory(params),
    queryFn: () => condolenceService.getPaymentHistory(params),
  });
}

export function useCreateCondolencePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CondolencePolicy, 'id'>) => condolenceService.createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.policies() });
    },
  });
}

export function useUpdateCondolencePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CondolencePolicy> }) =>
      condolenceService.updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.policies() });
    },
  });
}

export function useDeleteCondolencePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => condolenceService.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condolenceKeys.policies() });
    },
  });
}
