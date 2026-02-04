import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { condolenceService } from '../services/condolenceService';
import type { CondolenceSearchParams, CreateCondolenceRequest } from '@hr-platform/shared-types';

const condolenceKeys = {
  all: ['condolences'] as const,
  lists: () => [...condolenceKeys.all, 'list'] as const,
  list: (params?: CondolenceSearchParams) => [...condolenceKeys.lists(), params] as const,
  details: () => [...condolenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...condolenceKeys.details(), id] as const,
  policies: () => [...condolenceKeys.all, 'policies'] as const,
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
