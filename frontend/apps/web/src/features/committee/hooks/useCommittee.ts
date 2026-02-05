import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { committeeService } from '../services/committeeService';
import type { CommitteeSearchParams, CreateCommitteeRequest, AddCommitteeMemberRequest, CommitteeListItem } from '@hr-platform/shared-types';

const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  list: (params?: CommitteeSearchParams) => [...committeeKeys.lists(), params] as const,
  details: () => [...committeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...committeeKeys.details(), id] as const,
  members: (id: string) => [...committeeKeys.all, id, 'members'] as const,
};

// Backend returns List, implement client-side pagination
export function useCommittees(params?: CommitteeSearchParams) {
  const { page = 0, size = 10, status, ...otherParams } = params || {};

  const query = useQuery({
    queryKey: committeeKeys.list(params),
    queryFn: () => committeeService.getCommittees({ status, ...otherParams }),
  });

  // Transform to PageResponse-like structure for component compatibility
  const paginatedData = useMemo(() => {
    if (!query.data) return query.data;

    const allItems = query.data.data ?? [];
    const filteredItems = status
      ? allItems.filter((item: CommitteeListItem) => item.status === status)
      : allItems;
    const totalElements = filteredItems.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filteredItems.slice(start, end);

    return {
      ...query.data,
      data: {
        content,
        totalElements,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
      },
    };
  }, [query.data, page, size, status]);

  return {
    ...query,
    data: paginatedData,
  };
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
