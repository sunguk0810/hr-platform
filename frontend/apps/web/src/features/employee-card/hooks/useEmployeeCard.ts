import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeCardService } from '../services/employeeCardService';
import type { EmployeeCardSearchParams, CreateCardIssueRequest, ReportLostCardRequest } from '@hr-platform/shared-types';

const cardKeys = {
  all: ['employee-cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (params?: EmployeeCardSearchParams) => [...cardKeys.lists(), params] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  my: () => [...cardKeys.all, 'my'] as const,
  issueRequests: () => [...cardKeys.all, 'issue-requests'] as const,
};

export function useEmployeeCards(params?: EmployeeCardSearchParams) {
  return useQuery({
    queryKey: cardKeys.list(params),
    queryFn: () => employeeCardService.getCards(params),
  });
}

export function useEmployeeCard(id: string) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => employeeCardService.getCard(id),
    enabled: !!id,
  });
}

export function useMyEmployeeCard() {
  return useQuery({
    queryKey: cardKeys.my(),
    queryFn: () => employeeCardService.getMyCard(),
  });
}

export function useCardIssueRequests(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: cardKeys.issueRequests(),
    queryFn: () => employeeCardService.getIssueRequests(params),
  });
}

export function useCreateCardIssueRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardIssueRequest) => employeeCardService.createIssueRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.issueRequests() });
    },
  });
}

export function useApproveCardIssueRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeCardService.approveIssueRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.issueRequests() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}

export function useReportLostCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportLostCardRequest) => employeeCardService.reportLost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.my() });
    },
  });
}

export function useRevokeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeCardService.revokeCard(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}
