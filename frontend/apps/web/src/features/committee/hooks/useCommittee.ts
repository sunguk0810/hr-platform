import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { committeeService } from '../services/committeeService';
import type { CommitteeSearchParams, CreateCommitteeRequest, AddCommitteeMemberRequest } from '@hr-platform/shared-types';

const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  list: (params?: CommitteeSearchParams) => [...committeeKeys.lists(), params] as const,
  details: () => [...committeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...committeeKeys.details(), id] as const,
  members: (id: string) => [...committeeKeys.all, id, 'members'] as const,
};

export function useCommittees(params?: CommitteeSearchParams) {
  return useQuery({
    queryKey: committeeKeys.list(params),
    queryFn: () => committeeService.getCommittees(params),
  });
}

export function useCommittee(id: string) {
  return useQuery({
    queryKey: committeeKeys.detail(id),
    queryFn: () => committeeService.getCommittee(id),
    enabled: !!id,
  });
}

export function useCommitteeMembers(committeeId: string) {
  return useQuery({
    queryKey: committeeKeys.members(committeeId),
    queryFn: () => committeeService.getMembers(committeeId),
    enabled: !!committeeId,
  });
}

export function useCreateCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommitteeRequest) => committeeService.createCommittee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}

export function useAddCommitteeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, data }: { committeeId: string; data: AddCommitteeMemberRequest }) =>
      committeeService.addMember(committeeId, data),
    onSuccess: (_, { committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(committeeId) });
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(committeeId) });
    },
  });
}

export function useRemoveCommitteeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, memberId }: { committeeId: string; memberId: string }) =>
      committeeService.removeMember(committeeId, memberId),
    onSuccess: (_, { committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(committeeId) });
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(committeeId) });
    },
  });
}
